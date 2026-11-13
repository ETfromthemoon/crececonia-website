import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { flowGetStatus } from "./fixtures/flow-getstatus";

const database = vi.hoisted(() => vi.fn());
const delivery = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/marketplace-delivery", () => ({ sendMarketplaceDelivery: delivery }));
vi.mock("@/lib/flow", () => ({ getFlowBase: () => "https://sandbox.flow.cl/api", flowSign: () => "signature" }));

import { POST } from "../app/api/marketplace/flow/confirm/route";

const orderId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const itemId = "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const previousEnv = { ...process.env };

function callback() {
  return new Request("https://www.crececonia.cl/api/marketplace/flow/confirm", {
    method: "POST", body: new URLSearchParams({ token: "flow-test-token" }),
  });
}

describe("confirmación de compra marketplace", () => {
  beforeEach(() => {
    process.env.FLOW_SANDBOX = "true";
    process.env.FLOW_API_KEY = "test";
    process.env.FLOW_SECRET_KEY = "test";
    process.env.DATABASE_URL = "postgres://test";
    process.env.MARKETPLACE_DOWNLOAD_SECRET = "x".repeat(32);
    process.env.MARKETPLACE_SITE_URL = "https://marketplace.example.cl";
    process.env.RESEND_API_KEY = "test";
    delete process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      ...flowGetStatus({ amount: 11900, payer: "buyer@example.cl" }),
      commerceOrder: `mkt-${orderId}`,
    }) }));
    delivery.mockReset().mockResolvedValue(undefined);
    database.mockReset();
  });

  afterEach(() => {
    process.env = { ...previousEnv };
    vi.unstubAllGlobals();
  });

  it("registra mediante una sola operación atómica y acepta reintentos de Flow", async () => {
    database.mockResolvedValue([{ result: "recorded" }]);
    expect((await POST(callback())).status).toBe(200);
    expect((await POST(callback())).status).toBe(200);
    expect(database).toHaveBeenCalledTimes(2);
    expect(database.mock.calls.every(([sql]) => String(sql).includes("marketplace_confirm_sandbox_payment"))).toBe(true);
    expect(delivery).not.toHaveBeenCalled();
  });

  it("no concede acceso si el monto de Flow difiere de la orden", async () => {
    database.mockRejectedValueOnce(new Error("marketplace payment/order mismatch"));
    const response = await POST(callback());
    expect(response.status).toBe(500);
    expect(delivery).not.toHaveBeenCalled();
    expect(database).toHaveBeenCalledTimes(1);
  });

  it("rechaza cuerpos fragmentados que superan 2 KiB antes de consultar Flow", async () => {
    const request = new Request("https://www.crececonia.cl/api/marketplace/flow/confirm", {
      method: "POST",
      body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("token=" + "x".repeat(3000))); controller.close(); } }),
      duplex: "half",
    } as RequestInit & { duplex: string });
    expect((await POST(request)).status).toBe(413);
    expect(database).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
