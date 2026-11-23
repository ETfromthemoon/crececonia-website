import { beforeEach, describe, expect, it, vi } from "vitest";

const isAdminRequest = vi.hoisted(() => vi.fn());
const queryDatabase = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin-session", () => ({ isAdminRequest }));
vi.mock("@/lib/database", () => ({ queryDatabase }));

import { GET, POST } from "@/app/api/admin/marketplace/settlements/route";

const sellerId = "fe9d02b2-5b42-4ad6-9b8a-62f21daedbb0";
const url = "https://example.cl/api/admin/marketplace/settlements";
function post(body: Record<string, unknown>) {
  return new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

describe("liquidaciones manuales del marketplace", () => {
  beforeEach(() => {
    isAdminRequest.mockReset().mockReturnValue(true);
    queryDatabase.mockReset().mockResolvedValue([]);
  });

  it("exige administración antes de leer o escribir", async () => {
    isAdminRequest.mockReturnValue(false);
    expect((await GET(new Request(url))).status).toBe(401);
    expect((await POST(post({ sellerId }))).status).toBe(401);
    expect(queryDatabase).not.toHaveBeenCalled();
  });

  it("consulta el saldo ya conciliado sin datos bancarios", async () => {
    queryDatabase.mockResolvedValueOnce([{ seller_id: sellerId, available_minor: "10955", blocked: false }]);
    const response = await GET(new Request(url));
    expect(response.status).toBe(200);
    expect((await response.json()).balances[0].available_minor).toBe("10955");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rechaza monto y referencia inválidos sin tocar la base", async () => {
    const response = await POST(post({ sellerId, amountMinor: 0, reference: "x", occurredAt: "2026-11-16T12:00:00Z" }));
    expect(response.status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });

  it("registra pago externo y reconoce el reintento idéntico", async () => {
    const body = { sellerId, amountMinor: 10955, reference: "BANCO-123", occurredAt: "2026-11-16T12:00:00Z" };
    queryDatabase.mockResolvedValueOnce([{ settlement_id: "settlement-id", inserted: true }]);
    const first = await POST(post(body));
    expect(first.status).toBe(201);
    expect(queryDatabase.mock.calls[0][0]).toContain("marketplace_record_manual_settlement");
    expect(queryDatabase.mock.calls[0][1]).toEqual([sellerId, 10955, "BANCO-123", "2026-11-16T12:00:00Z"]);
    queryDatabase.mockResolvedValueOnce([{ settlement_id: "settlement-id", inserted: false }]);
    const retry = await POST(post(body));
    expect(retry.status).toBe(200);
  });

  it("no revela fallos internos ni crea un pago sin saldo", async () => {
    queryDatabase.mockRejectedValueOnce(new Error("marketplace settlement balance unavailable"));
    const response = await POST(post({ sellerId, amountMinor: 10955, reference: "BANCO-123", occurredAt: "2026-11-16T12:00:00Z" }));
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain("balance unavailable");
  });
});
