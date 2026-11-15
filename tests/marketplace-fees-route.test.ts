import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { adminCookieName, createAdminSession } from "@/lib/admin-session";
import { GET, POST } from "@/app/api/admin/marketplace/fees/route";

const database = vi.mocked(queryDatabase);
const endpoint = "https://crececonia.cl/api/admin/marketplace/fees";
const paymentId = "11111111-1111-4111-8111-111111111111";
const body = { paymentId, amountMinor: 357, statementReference: "FLOW-STMT-7788",
  evidenceNote: "Tarifa real cotejada con estado de cuenta Flow.", confirmedStatement: true };

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

describe("conciliación manual de tarifa Flow", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_SECRET", "fee-test-secret");
    database.mockReset();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("requiere sesión y Origin exacto para escribir", async () => {
    expect((await GET(request("GET"))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true }))).status).toBe(401);
    expect((await POST(request("POST", { cookie: true, origin: "https://other.cl" }))).status).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });

  it("muestra pagos sin tarifa real sin exponer correo o token Flow", async () => {
    database.mockResolvedValueOnce([{ payment_id: paymentId, total_minor: "11900" }]);
    const result = await GET(request("GET", { cookie: true }));
    expect(result.status).toBe(200);
    expect((await result.json()).payments).toEqual([{ payment_id: paymentId, total_minor: "11900" }]);
    expect(String(database.mock.calls[0][0])).toContain("gateway_fee_actual_minor is null");
    expect(String(database.mock.calls[0][0])).not.toContain("buyer_email");
    expect(String(database.mock.calls[0][0])).not.toContain("provider_payment_ref");
  });

  it("exige confirmación externa y monto entero", async () => {
    expect((await POST(request("POST", { cookie: true, origin: "https://crececonia.cl",
      body: { ...body, confirmedStatement: false } }))).status).toBe(400);
    expect((await POST(request("POST", { cookie: true, origin: "https://crececonia.cl",
      body: { ...body, amountMinor: 3.5 } }))).status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });

  it("registra tarifa cotejada y permite reintento idéntico", async () => {
    database.mockResolvedValueOnce([{ evidence_id: "22222222-2222-4222-8222-222222222222", recorded: true }]);
    const result = await POST(request("POST", { cookie: true, origin: "https://crececonia.cl" }));
    expect(result.status).toBe(201);
    expect(database.mock.calls[0][1]).toEqual([paymentId, 357, "FLOW-STMT-7788", body.evidenceNote]);
    database.mockResolvedValueOnce([{ evidence_id: "22222222-2222-4222-8222-222222222222", recorded: false }]);
    expect((await POST(request("POST", { cookie: true, origin: "https://crececonia.cl" }))).status).toBe(200);
  });
});
