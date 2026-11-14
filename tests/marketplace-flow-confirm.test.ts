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

  it("registra derecho, ledger y entrega una vez ante webhooks repetidos", async () => {
    const flowStatus = flowGetStatus({ amount: 11900, payer: "buyer@example.cl" });
    flowStatus.paymentData = { ...(flowStatus.paymentData as object), fee: "300.00", taxes: 57, balance: 11543 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...flowStatus, commerceOrder: `mkt-${orderId}` }) }));
    let outboxStatus = "pending";
    database.mockImplementation(async (sql: string) => {
      if (sql.includes("select o.id,o.buyer_email,o.status")) return [{
        id: orderId, buyer_email: "buyer@example.cl", status: "pending", total_minor: "11900",
        paid_at: null, item_id: itemId, price_minor: "11900", commission_minor: "595", title: "Libro",
      }];
      if (sql.includes("select id,provider_payment_ref,provider_account_ref,status")) return [{ id: "payment-id", provider_payment_ref: "flow-test-token", provider_account_ref: "crececonia", status: "pending" }];
      if (sql.includes("insert into public.marketplace_payments")) return [{ id: "payment-id" }];
      if (sql.includes("update public.marketplace_orders set status='paid'")) return [{ id: orderId }];
      if (sql.includes("update public.marketplace_outbox") && sql.includes("set status='processing'")) {
        if (outboxStatus !== "pending") return [];
        outboxStatus = "processing";
        return [{ id: "outbox-id", lease_until: "2026-11-13T12:02:00Z" }];
      }
      if (sql.includes("select status from public.marketplace_outbox")) return [{ status: outboxStatus }];
      if (sql.includes("select o.id,o.buyer_email,o.paid_at")) return [{
        id: orderId, buyer_email: "buyer@example.cl", paid_at: "2026-11-13T12:00:00Z",
        item_id: itemId, title: "Libro",
      }];
      if (sql.includes("set status='succeeded'")) {
        outboxStatus = "succeeded";
        return [{ id: "outbox-id" }];
      }
      return [];
    });
    expect((await POST(callback())).status).toBe(200);
    expect((await POST(callback())).status).toBe(200);
    expect(delivery).toHaveBeenCalledTimes(1);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("insert into public.marketplace_entitlements"))).toBe(true);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("insert into public.marketplace_ledger_entries"))).toBe(true);
    const paymentInsert = database.mock.calls.find(([sql]) => String(sql).includes("insert into public.marketplace_payments"));
    expect(paymentInsert?.[1]).toEqual([orderId, "flow-test-token", 11900, 357, "crececonia"]);
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

  it.each([
    { currency: "USD", merchantId: null },
    { currency: "CLP", merchantId: "otro-comercio" },
  ])("no concede acceso ante moneda o comercio Flow inesperado: %o", async (overrides) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      ...flowGetStatus({ amount: 11900, payer: "buyer@example.cl" }),
      commerceOrder: `mkt-${orderId}`, ...overrides,
    }) }));
    expect((await POST(callback())).status).toBe(500);
    expect(database).not.toHaveBeenCalled();
    expect(delivery).not.toHaveBeenCalled();
  });

  it("espera la referencia de checkout si Flow notifica antes de que se guarde", async () => {
    database.mockResolvedValueOnce([{
      id: orderId, buyer_email: "buyer@example.cl", status: "pending", total_minor: "11900",
      item_id: itemId, price_minor: "11900", commission_minor: "595", title: "Libro",
    }]).mockResolvedValueOnce([]);
    expect((await POST(callback())).status).toBe(500);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("status='review_required'"))).toBe(false);
    expect(delivery).not.toHaveBeenCalled();
  });

  it("envía a conciliación si la referencia de cuenta Flow cambió", async () => {
    database.mockResolvedValueOnce([{
      id: orderId, buyer_email: "buyer@example.cl", status: "pending", total_minor: "11900",
      item_id: itemId, price_minor: "11900", commission_minor: "595", title: "Libro",
    }]).mockResolvedValueOnce([{
      id: "payment-id", provider_payment_ref: "flow-test-token", provider_account_ref: "cuenta-distinta", status: "pending",
    }]).mockResolvedValueOnce([]);
    expect((await POST(callback())).status).toBe(500);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("status='review_required'"))).toBe(true);
    expect(database.mock.calls.some(([sql]) => String(sql).includes("marketplace_entitlements"))).toBe(false);
    expect(delivery).not.toHaveBeenCalled();
  });
});
