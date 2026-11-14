import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const send = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/marketplace-delivery", () => ({ sendMarketplaceDelivery: send }));

import { deliverMarketplaceOrder, deliverMarketplaceOutboxBatch } from "@/lib/marketplace-delivery-worker";
import { GET } from "@/app/api/cron/marketplace-delivery/route";

const orderId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const itemId = "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";

function setDeliveryDatabase() {
  let status = "pending";
  let attempts = 0;
  database.mockImplementation(async (sql: string) => {
    if (sql.includes("select aggregate_id from public.marketplace_outbox")) {
      return status === "pending" || status === "failed" ? [{ aggregate_id: orderId }] : [];
    }
    if (sql.includes("set status='processing'")) {
      if (status !== "pending" && status !== "failed") return [];
      status = "processing";
      attempts++;
      return [{ id: "outbox-id", lease_until: `lease-${attempts}` }];
    }
    if (sql.includes("select status from public.marketplace_outbox")) return [{ status }];
    if (sql.includes("select o.id,o.buyer_email,o.paid_at")) return [{
      id: orderId, buyer_email: "buyer@example.cl", paid_at: "2026-11-13T12:00:00Z", item_id: itemId, title: "Libro",
    }];
    if (sql.includes("set status='succeeded'")) { status = "succeeded"; return [{ id: "outbox-id" }]; }
    if (sql.includes("set status=case when attempts")) { status = attempts >= 5 ? "dead_letter" : "failed"; return []; }
    return [];
  });
  return { status: () => status, attempts: () => attempts };
}

describe("recuperación de entregas del marketplace", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "cron-test");
    vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "true");
    database.mockReset();
    send.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("rechaza cron sin secreto válido antes de consultar datos", async () => {
    expect((await GET(new Request("https://example.cl/api/cron/marketplace-delivery"))).status).toBe(401);
    expect((await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer otro" } }))).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "");
    expect((await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer " } }))).status).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });

  it("no consulta Neon antes de habilitar el marketplace", async () => {
    vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "false");
    const response = await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer cron-test" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ skipped: true });
    expect(database).not.toHaveBeenCalled();
  });

  it("recupera entregas de compras sandbox en preview", async () => {
    vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "false");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("MARKETPLACE_FLOW_SANDBOX_ENABLED", "true");
    vi.stubEnv("FLOW_SANDBOX", "true");
    vi.stubEnv("FLOW_API_KEY", "test-key");
    vi.stubEnv("FLOW_SECRET_KEY", "test-secret");
    vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/db");
    vi.stubEnv("RESEND_API_KEY", "test-resend");
    vi.stubEnv("MARKETPLACE_SITE_URL", "https://preview.example.cl");
    vi.stubEnv("MARKETPLACE_DOWNLOAD_SECRET", "x".repeat(32));
    setDeliveryDatabase();
    const response = await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer cron-test" } }));
    expect(response.status).toBe(200);
    expect((await response.json()).sent).toBe(1);
  });

  it("procesa lote acotado y no reenvía una entrega ya cerrada", async () => {
    const state = setDeliveryDatabase();
    const response = await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer cron-test" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ attempted: 1, sent: 1, failed: 0 });
    expect(state.status()).toBe("succeeded");
    expect(await deliverMarketplaceOrder(orderId)).toBe("already_sent");
    expect(send).toHaveBeenCalledTimes(1);
    const list = database.mock.calls.find(([sql]) => String(sql).includes("select aggregate_id from public.marketplace_outbox"));
    expect(list?.[1]).toEqual([5, 5]);
  });

  it("reintenta un error temporal y solo envía al recuperar", async () => {
    const state = setDeliveryDatabase();
    send.mockRejectedValueOnce(new Error("Resend temporal"));
    const first = await GET(new Request("https://example.cl/api/cron/marketplace-delivery", { headers: { authorization: "Bearer cron-test" } }));
    expect(first.status).toBe(503);
    expect(await first.json()).toEqual({ attempted: 1, sent: 0, failed: 1 });
    expect(state.status()).toBe("failed");
    expect(database.mock.calls.some(([sql]) => String(sql).includes("available_at=now()+interval '5 minutes'"))).toBe(true);
    expect(await deliverMarketplaceOutboxBatch()).toEqual({ attempted: 1, sent: 1, failed: 0 });
    expect(state.status()).toBe("succeeded");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("detiene los reintentos tras cinco fallos para conciliación manual", async () => {
    const state = setDeliveryDatabase();
    send.mockRejectedValue(new Error("Error persistente"));
    for (let attempt = 0; attempt < 5; attempt++) {
      expect(await deliverMarketplaceOutboxBatch()).toEqual({ attempted: 1, sent: 0, failed: 1 });
    }
    expect(state.status()).toBe("dead_letter");
    expect(state.attempts()).toBe(5);
    expect(await deliverMarketplaceOutboxBatch()).toEqual({ attempted: 0, sent: 0, failed: 0 });
    expect(send).toHaveBeenCalledTimes(5);
  });
});
