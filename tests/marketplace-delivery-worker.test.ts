import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
const delivery = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: database }));
vi.mock("@/lib/marketplace-delivery", () => ({ sendMarketplaceDelivery: delivery }));

import { processMarketplaceDeliveryBatch } from "@/lib/marketplace-delivery-worker";

const orderId = "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";
const itemId = "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29";

describe("marketplace durable delivery", () => {
  beforeEach(() => { database.mockReset(); delivery.mockReset(); });

  it("claims, sends, and closes with the same claim token", async () => {
    let claimed = false;
    database.mockImplementation(async (sql: string, args: unknown[]) => {
      if (sql.includes("with candidate")) {
        if (claimed) return [];
        claimed = true;
        return [{ id: "job-id", aggregate_id: orderId, claim_token: args[0], attempts: 1 }];
      }
      if (sql.includes("select o.id,o.buyer_email")) return [{ id: orderId, buyer_email: "buyer@example.cl", paid_at: "2026-11-13T12:00:00Z", item_id: itemId, title: "Libro" }];
      if (sql.includes("status='succeeded'")) return [{ id: "job-id" }];
      return [];
    });
    delivery.mockResolvedValue(undefined);
    expect(await processMarketplaceDeliveryBatch()).toEqual({ claimed: 1, delivered: 1, failed: 0 });
    const token = database.mock.calls.find(([sql]) => String(sql).includes("with candidate"))![1][0];
    expect(database.mock.calls.find(([sql]) => String(sql).includes("status='succeeded'"))![1]).toEqual(["job-id", token]);
    expect(delivery).toHaveBeenCalledTimes(1);
  });

  it("retries a failed send with backoff without closing the job", async () => {
    let claimed = false;
    database.mockImplementation(async (sql: string, args: unknown[]) => {
      if (sql.includes("with candidate")) {
        if (claimed) return [];
        claimed = true;
        return [{ id: "job-id", aggregate_id: orderId, claim_token: args[0], attempts: 2 }];
      }
      if (sql.includes("select o.id,o.buyer_email")) return [{ id: orderId, buyer_email: "buyer@example.cl", paid_at: "2026-11-13T12:00:00Z", item_id: itemId, title: "Libro" }];
      return [];
    });
    delivery.mockRejectedValue(new Error("provider unavailable"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(await processMarketplaceDeliveryBatch()).toEqual({ claimed: 1, delivered: 0, failed: 1 });
      expect(database.mock.calls.some(([sql]) => String(sql).includes("status=case when attempts>=8"))).toBe(true);
      expect(database.mock.calls.some(([sql]) => String(sql).includes("status='succeeded'"))).toBe(false);
    } finally { spy.mockRestore(); }
  });
});
