import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const storage = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: storage }));
vi.mock("@/lib/flow", () => ({ getFlowBase: () => "https://sandbox.flow.cl/api", flowSign: () => "signature" }));

import { POST } from "../app/api/marketplace/checkout/route";

const env = { ...process.env };
const bookId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
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
});
