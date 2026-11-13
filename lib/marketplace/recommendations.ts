/** Recommendations for approved marketplace listings. This module has no database or analytics access. */
export interface RecommendableBook {
  id: string;
  sellerId: string;
  category: string;
  publishedAt: string;
  status: "published" | "draft" | "in_review" | "paused" | "archived";
  sellerActive: boolean;
  assetReady: boolean;
  paymentReady: boolean;
  visibleFrom?: string | null;
  requiresExperience?: boolean;
}

export interface RecommendationContext {
  currentBookId?: string;
  currentSellerId?: string;
  currentCategory?: string;
  purchasedBookIds?: readonly string[];
  /** Explicit experience evidence; page view alone is not evidence. */
  experienced?: boolean;
  now: number;
  limit?: number;
}

/**
 * Stable editorial ranking: related topics first, then other authors and recent books.
 * No purchase history means no personalization; bought titles never appear again.
 * A caller must check publication/asset/payment state against authoritative data.
 */
export function recommendMarketplaceBooks(
  books: readonly RecommendableBook[],
  context: RecommendationContext
): RecommendableBook[] {
  const limit = Number.isInteger(context.limit) ? Math.max(0, Math.min(context.limit!, 12)) : 4;
  if (!Number.isFinite(context.now) || limit === 0) return [];
  const purchased = new Set(context.purchasedBookIds ?? []);
  const seen = new Set<string>();
  const eligible = books.filter((book) => {
    if (!book.id || seen.has(book.id)) return false;
    seen.add(book.id);
    if (book.id === context.currentBookId || purchased.has(book.id)) return false;
    if (book.status !== "published" || !book.sellerActive || !book.assetReady || !book.paymentReady) return false;
    if (book.requiresExperience && !context.experienced) return false;
    if (book.visibleFrom && (!Number.isFinite(Date.parse(book.visibleFrom)) || Date.parse(book.visibleFrom) > context.now)) return false;
    return true;
  });

  eligible.sort((a, b) => {
    const aRelated = Number(Boolean(context.currentCategory && a.category === context.currentCategory));
    const bRelated = Number(Boolean(context.currentCategory && b.category === context.currentCategory));
    if (aRelated !== bRelated) return bRelated - aRelated;
    const aOtherAuthor = Number(Boolean(context.currentSellerId && a.sellerId !== context.currentSellerId));
    const bOtherAuthor = Number(Boolean(context.currentSellerId && b.sellerId !== context.currentSellerId));
    if (aOtherAuthor !== bOtherAuthor) return bOtherAuthor - aOtherAuthor;
    const aTime = Date.parse(a.publishedAt);
    const bTime = Date.parse(b.publishedAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
    return a.id.localeCompare(b.id);
  });

  // A seller gets at most one slot until all other eligible sellers have a slot.
  const selected: RecommendableBook[] = [];
  const deferred: RecommendableBook[] = [];
  const usedSellers = new Set<string>();
  for (const book of eligible) {
    if (usedSellers.has(book.sellerId)) deferred.push(book);
    else {
      selected.push(book);
      usedSellers.add(book.sellerId);
    }
  }
  return [...selected, ...deferred].slice(0, limit);
}
