import { describe, expect, it } from "vitest";
import { buildPostSaleMessage, postSaleEventKey, type PostSaleEvent } from "@/lib/marketplace/post-sale";

const purchasedAt = new Date("2026-10-01T12:00:00Z");
const base: PostSaleEvent = {
  kind: "purchase-access", orderId: "order_1", buyerEmail: "buyer@example.cl",
  bookTitle: "IA práctica", authorName: "Autora", recipientVerified: false,
  entitlementActive: true, marketingConsent: false, optedOut: false, purchasedAt,
  libraryUrl: "https://www.crececonia.cl/cuenta/biblioteca",
  preferenceUrl: "https://www.crececonia.cl/cuenta/preferencias",
};

describe("marketplace post-sale decisions", () => {
  it("retries a purchase notification with the same outbox key and no access token", () => {
    const first = buildPostSaleMessage(base, new Date("2026-10-01T13:00:00Z"));
    const retry = buildPostSaleMessage(base, new Date("2026-10-02T13:00:00Z"));
    expect(first?.eventKey).toBe("marketplace:order_1:purchase-access");
    expect(retry?.eventKey).toBe(first?.eventKey);
    expect(first?.text).toContain("/cuenta/biblioteca");
    expect(first?.text).not.toContain("token=");
  });

  it("requires a verified recipient and an active entitlement to recover access", () => {
    expect(buildPostSaleMessage({ ...base, kind: "access-recovery" }, new Date())).toBeNull();
    expect(buildPostSaleMessage({ ...base, kind: "access-recovery", recipientVerified: true, entitlementActive: false }, new Date())).toBeNull();
    expect(buildPostSaleMessage({ ...base, kind: "access-recovery", recipientVerified: true }, new Date())?.to).toBe(base.buyerEmail);
  });

  it("sends review invitations only after 14 days with verified opt-in and no opt-out", () => {
    const review = { ...base, kind: "review-invitation" as const, recipientVerified: true, marketingConsent: true };
    expect(buildPostSaleMessage(review, new Date("2026-10-14T11:59:59Z"))).toBeNull();
    expect(buildPostSaleMessage({ ...review, optedOut: true }, new Date("2026-10-16T12:00:00Z"))).toBeNull();
    expect(buildPostSaleMessage({ ...review, marketingConsent: false }, new Date("2026-10-16T12:00:00Z"))).toBeNull();
    expect(buildPostSaleMessage(review, new Date("2026-10-15T12:00:00Z"))?.text).toContain("/cuenta/preferencias");
  });

  it("keeps distinct events separate and rejects invalid keys", () => {
    expect(postSaleEventKey("purchase-access", "order_1")).not.toBe(postSaleEventKey("access-recovery", "order_1"));
    expect(() => postSaleEventKey("purchase-access", "../x")).toThrow();
    expect(() => buildPostSaleMessage({ ...base, libraryUrl: "https://evil.example/steal" }, new Date())).toThrow();
  });
});
