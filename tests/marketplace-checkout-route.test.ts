import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const storage = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: storage }));
vi.mock("@/lib/flow", () => ({ getFlowBase: () => "https://sandbox.flow.cl/api", flowSign: () => "signature" }));

import { POST } from "../app/api/marketplace/checkout/route";

const env = { ...process.env };
const bookId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const requestId = "c650e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const orderId = "a950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const request = (expectedAmount = 11_900, id = requestId) => new Request("https://www.crececonia.cl/api/marketplace/checkout", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ bookId, email: "buyer@example.cl", expectedAmount, requestId: id }),
});

describe("inicio de checkout marketplace", () => {
  beforeEach(() => {
    process.env.FLOW_SANDBOX = "true";
    process.env.FLOW_API_KEY = "test";
    process.env.FLOW_SECRET_KEY = "test";
    process.env.DATABASE_URL = "postgres://test";
    process.env.RESEND_API_KEY = "test";
    process.env.MARKETPLACE_DOWNLOAD_SECRET = "x".repeat(32);
    process.env.MARKETPLACE_SITE_URL = "https://marketplace.example.cl";
    process.env.VERCEL_ENV = "preview";
    database.mockReset();
    storage.mockReset();
  });
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it("rechaza cobros si la bandera sandbox no está activa", async () => {
    delete process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED;
    expect((await POST(request())).status).toBe(503);
    expect(database).not.toHaveBeenCalled();
  });

  it("vuelve a leer el precio y rechaza un monto viejo antes de llamar a Flow", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
    }]);
    const flow = vi.fn();
    vi.stubGlobal("fetch", flow);
    expect((await POST(request(10_000))).status).toBe(409);
    expect(storage).not.toHaveBeenCalled();
    expect(flow).not.toHaveBeenCalled();
  });

  it("rechaza PDF alterado antes de crear una orden de pago", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: "a".repeat(64), byte_size: 6,
    }]);
    storage.mockResolvedValueOnce({ data: new Blob(["%PDF-X"], { type: "application/pdf" }), error: null });
    const flow = vi.fn();
    vi.stubGlobal("fetch", flow);
    expect((await POST(request())).status).toBe(503);
    expect(storage).toHaveBeenCalledWith("ebooks", "test.pdf");
    expect(database).toHaveBeenCalledTimes(1);
    expect(flow).not.toHaveBeenCalled();
  });

  it("crea el manifiesto antes de obtener el enlace sandbox de Flow", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    const pdf = "%PDF-test";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: createHash("sha256").update(pdf).digest("hex"), byte_size: pdf.length,
    }]).mockResolvedValueOnce([{ outcome: "created", claimed_order_id: orderId }]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    storage.mockResolvedValueOnce({ data: new Blob([pdf], { type: "application/pdf" }), error: null });
    const flow = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "https://sandbox.flow.cl/app/web/pay.php", token: "test-token" }) });
    vi.stubGlobal("fetch", flow);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).redirectUrl).toContain("token=test-token");
    expect(database.mock.calls[1][0]).toContain("claim_marketplace_checkout");
    expect(database.mock.calls[0][0]).toContain("t.review_status='verified'");
    expect(database.mock.calls[1][1][1]).toBe(requestId);
    expect(database.mock.calls[0][0]).toContain("r.rights_declared_at is not null");
    expect(flow).toHaveBeenCalledTimes(1);
  });

  it("reutiliza el enlace de Flow para el mismo intento sin generar otro pago", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    const pdf = "%PDF-test";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: createHash("sha256").update(pdf).digest("hex"), byte_size: pdf.length,
    }]).mockResolvedValueOnce([{ outcome: "replay", claimed_order_id: orderId }])
      .mockResolvedValueOnce([{ flow_checkout_url: "https://sandbox.flow.cl/pay?token=original", status: "pending", expires_at: new Date(Date.now() + 60_000).toISOString() }]);
    storage.mockResolvedValueOnce({ data: new Blob([pdf]), error: null });
    const flow = vi.fn();
    vi.stubGlobal("fetch", flow);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectUrl: "https://sandbox.flow.cl/pay?token=original", orderId });
    expect(flow).not.toHaveBeenCalled();
  });

  it("rechaza un cuerpo excesivo antes de consultar la base", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    const oversized = new Request("https://www.crececonia.cl/api/marketplace/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, requestId, email: "buyer@example.cl", expectedAmount: 11900, padding: "x".repeat(3000) }),
    });
    expect((await POST(oversized)).status).toBe(400);
    expect(database).not.toHaveBeenCalled();
  });

  it("no llama a Flow cuando la cuota transaccional rechaza la orden", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    const pdf = "%PDF-test";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: createHash("sha256").update(pdf).digest("hex"), byte_size: pdf.length,
    }]).mockResolvedValueOnce([{ outcome: "rate_limited", claimed_order_id: null }]);
    storage.mockResolvedValueOnce({ data: new Blob([pdf]), error: null });
    const flow = vi.fn();
    vi.stubGlobal("fetch", flow);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
    expect(flow).not.toHaveBeenCalled();
  });
});
