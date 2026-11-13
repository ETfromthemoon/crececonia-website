import { describe, expect, it } from "vitest";
import { recommendMarketplaceBooks, type RecommendableBook } from "@/lib/marketplace/recommendations";

const base: RecommendableBook = {
  id: "a", sellerId: "seller-1", category: "ia", publishedAt: "2026-11-01T12:00:00Z",
  status: "published", sellerActive: true, assetReady: true, paymentReady: true,
};
const context = { now: Date.parse("2026-11-13T12:00:00Z"), currentCategory: "ia", currentSellerId: "seller-1" };

describe("marketplace recommendations", () => {
  it("only offers purchasable published titles and never repeats the current or purchased book", () => {
    const books = [base, { ...base, id: "draft", status: "draft" as const },
      { ...base, id: "missing", assetReady: false }, { ...base, id: "payment", paymentReady: false },
      { ...base, id: "suspended", sellerActive: false }, { ...base, id: "later", visibleFrom: "2026-12-01T00:00:00Z" },
      { ...base, id: "other", sellerId: "seller-2" }];
    expect(recommendMarketplaceBooks(books, { ...context, currentBookId: "a" }).map((b) => b.id)).toEqual(["other"]);
    expect(recommendMarketplaceBooks(books, { ...context, purchasedBookIds: ["other"] }).map((b) => b.id)).toEqual(["a"]);
  });

  it("does not infer experience from a page view", () => {
    const advanced = { ...base, id: "expert", requiresExperience: true };
    expect(recommendMarketplaceBooks([advanced], context)).toEqual([]);
    expect(recommendMarketplaceBooks([advanced], { ...context, experienced: true })).toEqual([advanced]);
  });

  it("prioritizes relevant books and diversifies sellers deterministically", () => {
    const books = [base, { ...base, id: "b", sellerId: "seller-1", publishedAt: "2026-11-12T12:00:00Z" },
      { ...base, id: "c", sellerId: "seller-2" }, { ...base, id: "d", sellerId: "seller-3", category: "negocios" }];
    expect(recommendMarketplaceBooks(books, { ...context, limit: 3 }).map((b) => b.id)).toEqual(["c", "b", "d"]);
  });
});
