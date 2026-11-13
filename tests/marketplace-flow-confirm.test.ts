import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

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
      status: 2, payer: "buyer@example.cl", amount: "11900", flowOrder: 123,
      commerceOrder: `mkt-${orderId}`,
    }) }));
    delivery.mockReset().mockResolvedValue(undefined);
    database.mockReset();
  });

  afterEach(() => {
    process.env = { ...previousEnv };
    vi.unstubAllGlobals();
  });

  it("registra derecho, ledger y entrega una vez ante webhooks repetidos", async () => {
    let sent = false;
    database.mockImplementation(async (sql: string) => {
      if (sql.includes("select o.id,o.buyer_email,o.status")) return [{
        id: orderId, buyer_email: "buyer@example.cl", status: "pending", total_minor: "11900",
        paid_at: null, item_id: itemId, price_minor: "11900", commission_minor: "595", title: "Libro",
      }];
      if (sql.includes("select id,provider_payment_ref,status")) return [{ id: "payment-id", provider_payment_ref: "flow-test-token", status: "pending" }];
      if (sql.includes("insert into public.marketplace_payments")) return [{ id: "payment-id" }];
      if (sql.includes("update public.marketplace_orders set status='paid'")) return [{ id: orderId }];
      if (sql.includes("select o.id,o.buyer_email,o.paid_at")) return [{
        id: orderId, buyer_email: "buyer@example.cl", paid_at: "2026-11-13T12:00:00Z",
        item_id: itemId, title: "Libro", outbox_status: sent ? "succeeded" : "pending",
      }];
      if (sql.includes("update public.marketplace_outbox set status='succeeded'")) sent = true;
      return [];
    });
    expect((await POST(callback())).status).toBe(200);
    expect((await POST(callback())).status).toBe(200);
    expect(delivery).toHaveBeenCalledTimes(1);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("insert into public.marketplace_entitlements"))).toBe(true);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("insert into public.marketplace_ledger_entries"))).toBe(true);
  });

  it("no concede acceso si el monto de Flow difiere de la orden", async () => {
    database.mockResolvedValueOnce([{
      id: orderId, buyer_email: "buyer@example.cl", status: "pending", total_minor: "10000",
      item_id: itemId, price_minor: "10000", commission_minor: "500", title: "Libro",
    }]);
    const response = await POST(callback());
    expect(response.status).toBe(500);
    expect(delivery).not.toHaveBeenCalled();
    expect(database).toHaveBeenCalledTimes(1);
  });
});
