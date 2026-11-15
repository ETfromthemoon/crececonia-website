import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { adminCookieName, createAdminSession } from "@/lib/admin-session";
import { GET, POST } from "@/app/api/admin/marketplace/refunds/route";

const database = vi.mocked(queryDatabase);
const endpoint = "https://crececonia.cl/api/admin/marketplace/refunds";
const paymentId = "11111111-1111-4111-8111-111111111111";
const body = {
  paymentId, kind: "refund", providerReference: "FLOW-REF-7788",
  evidenceNote: "Reembolso completo confirmado en el panel de Flow.", confirmedExternal: true,
};

function request(method: "GET" | "POST", options: { cookie?: boolean; origin?: string; body?: unknown } = {}) {
  return new Request(endpoint, {
    method,
    headers: {
      ...(options.cookie ? { cookie: `${adminCookieName()}=${createAdminSession()}` } : {}),
      ...(options.origin ? { origin: options.origin } : {}),
      ...(method === "POST" ? { "content-type": "application/json" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(options.body ?? body) } : {}),
  });
}

describe("reversos externos del marketplace", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", "refund-test-secret");
    database.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("requiere sesión y Origin exacto para registrar un reverso", async () => {
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true, origin: "https://other.cl" }))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true }))).status).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });

  it("rechaza una referencia sin confirmación externa", async () => {
    const result = await POST(request("POST", { cookie: true, origin: "https://crececonia.cl",
      body: { ...body, confirmedExternal: false } }));
    expect(result.status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });

  it("registra una sola vez un reverso completo ya realizado fuera del sitio", async () => {
    database.mockResolvedValueOnce([{ reversal_id: "22222222-2222-4222-8222-222222222222", recorded: true }]);
    const result = await POST(request("POST", { cookie: true, origin: "https://crececonia.cl" }));
    expect(result.status).toBe(201);
    expect(database.mock.calls[0][0]).toContain("marketplace_record_external_reversal");
    expect(database.mock.calls[0][1]).toEqual([paymentId, "FLOW-REF-7788", "refund", body.evidenceNote]);
    database.mockResolvedValueOnce([{ reversal_id: "22222222-2222-4222-8222-222222222222", recorded: false }]);
    expect((await POST(request("POST", { cookie: true, origin: "https://crececonia.cl" }))).status).toBe(200);
  });

  it("lista pagos elegibles y reversos sin datos personales ni token Flow", async () => {
    database.mockResolvedValueOnce([{ payment_id: paymentId, total_minor: "11900" }])
      .mockResolvedValueOnce([{ id: "reversal-id", reason_code: "refund" }]);
    const result = await GET(request("GET", { cookie: true }));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ eligible: [{ payment_id: paymentId, total_minor: "11900" }],
      reversals: [{ id: "reversal-id", reason_code: "refund" }] });
    expect(String(database.mock.calls[0][0])).not.toContain("buyer_email");
    expect(String(database.mock.calls[0][0])).not.toContain("provider_payment_ref");
  });
});
