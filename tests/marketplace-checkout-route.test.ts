import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const storage = vi.hoisted(() => vi.fn());
const allowAttempt = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: storage }));
vi.mock("@/lib/marketplace-checkout-rate-limit", () => ({
  allowMarketplaceCheckoutAttempt: allowAttempt,
  marketplaceClientIp: () => "203.0.113.7",
}));
vi.mock("@/lib/flow", () => ({ getFlowBase: () => process.env.FLOW_SANDBOX === "true" ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api", flowSign: () => "signature" }));

import { POST } from "../app/api/marketplace/checkout/route";

const env = { ...process.env };
const bookId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const verificationId = "a950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const pdfAssetId = "b950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const request = (expectedAmount = 11_900) => new Request("https://www.crececonia.cl/api/marketplace/checkout", {
  method: "POST", body: JSON.stringify({ bookId, email: "buyer@example.cl", expectedAmount }),
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
    delete process.env.MARKETPLACE_LIVE_ENABLED;
    database.mockReset();
    storage.mockReset();
    allowAttempt.mockReset().mockResolvedValue(true);
  });
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it("rechaza cobros si la bandera sandbox no está activa", async () => {
    delete process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED;
    expect((await POST(request())).status).toBe(503);
    expect(database).not.toHaveBeenCalled();
  });

  it("limita intentos antes de leer el libro o llamar a Flow", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    allowAttempt.mockResolvedValueOnce(false);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("900");
    expect(database).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });

  it("vuelve a leer el precio y rechaza un monto viejo antes de llamar a Flow", async () => {
    process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED = "true";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      verification_id: verificationId, pdf_asset_id: pdfAssetId,
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
      verification_id: verificationId, pdf_asset_id: pdfAssetId,
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
      verification_id: verificationId, pdf_asset_id: pdfAssetId,
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: createHash("sha256").update(pdf).digest("hex"), byte_size: pdf.length,
    }]).mockResolvedValueOnce([{ item_id: "item" }]).mockResolvedValueOnce([]);
    storage.mockResolvedValueOnce({ data: new Blob([pdf], { type: "application/pdf" }), error: null });
    const flow = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "https://sandbox.flow.cl/app/web/pay.php", token: "test-token" }) });
    vi.stubGlobal("fetch", flow);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).redirectUrl).toContain("token=test-token");
    expect(database.mock.calls[1][0]).toContain("marketplace_order_items");
    expect(database.mock.calls[2][1]).toEqual([expect.any(String), "test-token", 11900, "crececonia"]);
    expect(database.mock.calls[0][0]).toContain("t.review_status='verified'");
    expect(database.mock.calls[1][0]).toContain("t.review_status='verified'");
    expect(database.mock.calls[0][0]).toContain("t.reviewed_at >= now() - interval '6 months'");
    expect(database.mock.calls[1][0]).toContain("t.reviewed_at >= now() - interval '6 months'");
    expect(database.mock.calls[0][0]).toContain("r.rights_declared_at is not null");
    expect(database.mock.calls[0][0]).toContain("a.id=v.pdf_asset_id");
    expect(database.mock.calls[1][0]).toContain("v.id=$11");
    expect(database.mock.calls[1][0]).toContain("seller_id,pdf_asset_id,price_minor");
    expect(database.mock.calls[1][0]).toContain("commission_basis_minor,commission_minor,commission_tax_minor");
    expect(database.mock.calls[1][1].slice(6)).toEqual([1900, 1900, 900, 1071, verificationId, pdfAssetId, 10000, 171]);
    expect(new URLSearchParams(flow.mock.calls[0][1].body).get("amount")).toBe("11900");
    expect(flow).toHaveBeenCalledTimes(1);
  });

  it("solo usa la misma cuenta Flow productiva tras habilitar el checkout público", async () => {
    process.env.FLOW_SANDBOX = "false";
    process.env.VERCEL_ENV = "production";
    process.env.MARKETPLACE_SITE_URL = "https://www.crececonia.cl";
    process.env.MARKETPLACE_PUBLIC_ENABLED = "true";
    expect((await POST(request())).status).toBe(503);
    process.env.MARKETPLACE_LIVE_ENABLED = "true";
    const pdf = "%PDF-test";
    database.mockResolvedValueOnce([{
      book_id: bookId, revision_id: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      seller_id: "f950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29", title: "Libro",
      verification_id: verificationId, pdf_asset_id: pdfAssetId,
      price_minor: "11900", price_tax_mode: "tax_inclusive", storage_key: "test.pdf",
      sha256: createHash("sha256").update(pdf).digest("hex"), byte_size: pdf.length,
    }]).mockResolvedValueOnce([{ item_id: "item" }]).mockResolvedValueOnce([]);
    storage.mockResolvedValueOnce({ data: new Blob([pdf], { type: "application/pdf" }), error: null });
    const flow = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "https://www.flow.cl/app/web/pay.php", token: "live-token" }) });
    vi.stubGlobal("fetch", flow);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).redirectUrl).toContain("www.flow.cl/app/web/pay.php?token=live-token");
    expect(flow.mock.calls[0][0]).toBe("https://www.flow.cl/api/payment/create");
    expect(String(flow.mock.calls[0][1].body)).not.toContain("merchantId");
    expect(database.mock.calls[2][1]).toEqual([expect.any(String), "live-token", 11900, "crececonia"]);
  });
});
