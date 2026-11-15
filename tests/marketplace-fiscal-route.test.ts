import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { adminCookieName, createAdminSession } from "@/lib/admin-session";
import { GET, POST } from "@/app/api/admin/marketplace/fiscal/route";

const database = vi.mocked(queryDatabase);
const endpoint = "https://crececonia.cl/api/admin/marketplace/fiscal";
const orderId = "11111111-1111-4111-8111-111111111111";
const validBody = { orderId, documentKind: "voucher", documentReference: "FLOW-7788", issuedAt: "2026-11-15T18:30:00-03:00" };

function request(method: "GET" | "POST", options: { cookie?: boolean; origin?: string; body?: unknown; machine?: boolean } = {}) {
  return new Request(endpoint, {
    method,
    headers: {
      ...(options.cookie ? { cookie: `${adminCookieName()}=${createAdminSession()}` } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
      ...(options.machine ? { "x-admin-key": "fiscal-test-secret" } : {}),
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(options.body ?? validBody) } : {}),
  });
}

describe("marketplace fiscal evidence", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", "fiscal-test-secret");
    database.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("requires admin auth and exact origin for browser mutations", async () => {
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true, origin: "https://other.example" }))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true }))).status).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });

  it("lists only paid orders lacking fiscal evidence without buyer data", async () => {
    database.mockResolvedValueOnce([{ order_id: orderId, total_minor: "11900", paid_at: "2026-11-15T21:30:00Z" }]);
    const response = await GET(request("GET", { cookie: true }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orders: [{ order_id: orderId, total_minor: "11900", paid_at: "2026-11-15T21:30:00Z" }] });
    const [sql] = database.mock.calls[0];
    expect(sql).toContain("o.status = 'paid'");
    expect(sql).toContain("not exists (select 1 from public.marketplace_fiscal_evidence");
    expect(sql).not.toContain("buyer_email");
  });

  it("rejects malformed document data before database writes", async () => {
    const response = await POST(request("POST", { cookie: true, origin: "https://crececonia.cl", body: { ...validBody, documentReference: "bad\nref" } }));
    expect(response.status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });

  it("records only a confirmed Flow payment and audits once", async () => {
    database.mockResolvedValueOnce([{ id: "22222222-2222-4222-8222-222222222222", inserted: true }]);
    const response = await POST(request("POST", { cookie: true, origin: "https://crececonia.cl" }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "22222222-2222-4222-8222-222222222222", status: "recorded" });
    const [sql, args] = database.mock.calls[0];
    expect(sql).toContain("o.status = 'paid'");
    expect(sql).toContain("p.status = 'confirmed'");
    expect(sql).toContain("p.amount_minor = o.total_minor");
    expect(sql).toContain("on conflict do nothing");
    expect(sql).toContain("'fiscal_evidence_recorded'");
    expect(args).toEqual([orderId, "voucher", "FLOW-7788", "2026-11-15T18:30:00-03:00", "crececonia"]);
  });

  it("returns the same evidence for an identical retry and conflicts on a different document", async () => {
    database.mockResolvedValueOnce([{ id: "22222222-2222-4222-8222-222222222222", inserted: false }]);
    expect((await POST(request("POST", { machine: true }))).status).toBe(200);
    database.mockResolvedValueOnce([]);
    expect((await POST(request("POST", { machine: true, body: { ...validBody, documentReference: "OTHER-REF" } }))).status).toBe(409);
  });
});
