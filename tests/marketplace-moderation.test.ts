import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { getMarketplaceRecommendations, listPublishedMarketplaceBooks, moderateMarketplaceBook, setMarketplaceSellerStatus, verifyMarketplaceSellerTax } from "@/lib/marketplace-review";

const bookId = "11111111-1111-4111-8111-111111111111";
const revisionId = "22222222-2222-4222-8222-222222222222";
const sellerId = "33333333-3333-4333-8333-333333333333";
const database = vi.mocked(queryDatabase);

beforeEach(() => {
  database.mockReset();
  database.mockResolvedValue([{ id: bookId }]);
});

describe("marketplace moderation transition contracts", () => {
  it("approves only the current pending revision after rights, tax and PDF checks", async () => {
    expect(await moderateMarketplaceBook({ bookId, revisionId, action: "approve" })).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("b.current_revision_id");
    expect(sql).toContain("b.status = 'in_review'");
    expect(sql).toContain("r.moderation_status = 'pending'");
    expect(sql).toContain("t.review_status = 'verified'");
    expect(sql).toContain("r.rights_declared_at is not null");
    expect(sql).toContain("r.price_tax_mode in ('tax_inclusive', 'exempt')");
    expect(sql).toContain("a.scan_status = 'ready'");
    expect(values).toEqual([bookId, revisionId, "approve", "approved", null, "approved"]);
  });

  it("publishes only the reviewed current revision of an active verified seller", async () => {
    expect(await moderateMarketplaceBook({ bookId, revisionId, action: "publish" })).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("b.current_revision_id = $2");
    expect(sql).toContain("r.moderation_status = 'approved'");
    expect(sql).toContain("s.status = 'active'");
    expect(sql).toContain("t.review_status = 'verified'");
    expect(sql).toContain("a.scan_status = 'ready'");
    expect(sql).toContain("published_revision_id = b.current_revision_id");
    expect(values).toEqual([bookId, revisionId]);
  });

  it("pauses only the revision currently published, not an unreviewed draft", async () => {
    expect(await moderateMarketplaceBook({ bookId, revisionId, action: "pause" })).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("published_revision_id = $2");
    expect(sql).toContain("status = 'published'");
    expect(values).toEqual([bookId, revisionId, null]);
  });

  it("requires verified tax profile and accepted terms before activating a seller", async () => {
    expect(await setMarketplaceSellerStatus(sellerId, "activate", "Validado contra SII")).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("t.review_status = 'verified'");
    expect(sql).toContain("s.terms_accepted_at is not null");
    expect(values).toEqual([sellerId, "active", "pending_verification", "activate", "Validado contra SII"]);
  });

  it("does not write for invalid identifiers or missing rejection reason", async () => {
    await expect(moderateMarketplaceBook({ bookId: "bad", revisionId, action: "approve" })).rejects.toThrow();
    await expect(moderateMarketplaceBook({ bookId, revisionId, action: "reject", reason: "no" })).rejects.toThrow();
    expect(database).not.toHaveBeenCalled();
  });

  it("reports stale state when the database transition changes no row", async () => {
    database.mockResolvedValueOnce([]);
    expect(await moderateMarketplaceBook({ bookId, revisionId, action: "approve" })).toBe(false);
  });

  it("allows rejecting an uncertain tax declaration but keeps verification gated", async () => {
    expect(await verifyMarketplaceSellerTax(sellerId, "reject", "Falta definir situación tributaria")).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("($3 <> 'verify' or t.declared_vat_status <> 'unsure')");
    expect(values).toEqual([sellerId, "rejected", "reject", "Falta definir situación tributaria"]);

    database.mockClear();
    expect(await verifyMarketplaceSellerTax(sellerId, "verify", "Verificado en el SII")).toBe(true);
    expect(database.mock.calls[0][1]).toEqual([sellerId, "verified", "verify", "Verificado en el SII"]);
  });

  it("returns a lookahead row and advances past the first hundred published books", async () => {
    await listPublishedMarketplaceBooks(5);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("order by b.published_at desc, b.id desc");
    expect(sql).toContain("limit 25 offset $1");
    expect(values).toEqual([96]);
    await expect(listPublishedMarketplaceBooks(0)).rejects.toThrow("Página inválida");
    expect(database).toHaveBeenCalledTimes(1);
  });

  it("recommends related approved books from other authors using a gated live query", async () => {
    const current = { id: bookId, slug: "actual", title: "Actual", subtitle: "", description: "Libro actual",
      author_display_name: "Autora", category: "ia" as const, price_minor: "5000", seller_name: "Autora", seller_slug: "autora" };
    const candidate = (id: string, category: "ia" | "negocios", seller: string) => ({
      ...current, id, slug: id, category, seller_slug: seller,
      published_at: "2026-01-01T12:00:00.000Z",
    });
    database.mockResolvedValueOnce([
      candidate("same-author", "ia", "autora"),
      candidate("other-author", "ia", "otra"),
      candidate("other-topic", "negocios", "tercera"),
    ]);
    const result = await getMarketplaceRecommendations(current);
    expect(result.map((book) => book.id)).toEqual(["other-author", "same-author", "other-topic"]);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("s.status = 'active'");
    expect(sql).toContain("t.review_status = 'verified'");
    expect(sql).toContain("r.moderation_status = 'approved'");
    expect(sql).toContain("a.scan_status = 'ready'");
    expect(values).toEqual([bookId, "ia"]);
  });
});
