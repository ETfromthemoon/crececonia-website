import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { getMarketplaceRecommendations, getPublishedMarketplaceCover, listMarketplaceReviews, listPublishedMarketplaceBooks, moderateMarketplaceBook, setMarketplaceSellerStatus, verifyMarketplaceSellerTax } from "@/lib/marketplace-review";

const bookId = "11111111-1111-4111-8111-111111111111";
const revisionId = "22222222-2222-4222-8222-222222222222";
const sellerId = "33333333-3333-4333-8333-333333333333";
const database = vi.mocked(queryDatabase);
const migration = (name: string) => readFileSync(new URL(`../database/migrations/${name}`, import.meta.url), "utf8");

beforeEach(() => {
  database.mockReset();
  database.mockResolvedValue([{ id: bookId }]);
});

describe("marketplace publication migration guards", () => {
  it("rejects seller reassignment for every existing book", () => {
    const sql = migration("20261115_004_marketplace_seller_attribution.up.sql");
    expect(sql).toContain("new.seller_id is distinct from old.seller_id");
    expect(sql).toContain("before update of seller_id on public.marketplace_books");
  });

  it("does not silently erase final verification records on rollback", () => {
    const sql = migration("20261115_001_marketplace_publication_checks.down.sql");
    expect(sql).toContain("if exists (select 1 from public.marketplace_publication_checks)");
    expect(sql.indexOf("raise exception")).toBeLessThan(sql.indexOf("drop table if exists"));
  });
});

describe("marketplace moderation transition contracts", () => {
  it("shows a final verification only while the exact reviewed PDF and cover remain ready", async () => {
    await listMarketplaceReviews();
    const sql = database.mock.calls[0][0];
    expect(sql).toContain("pdf.id = v.pdf_asset_id");
    expect(sql).toContain("pdf.asset_kind = 'ebook_pdf' and pdf.scan_status = 'ready'");
    expect(sql).toContain("cover.id = v.cover_asset_id");
    expect(sql).toContain("cover.asset_kind = 'cover' and cover.scan_status = 'ready'");
  });

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
    expect(sql).toContain("a.asset_kind = 'cover'");
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
    expect(sql).toContain("a.asset_kind = 'cover'");
    expect(sql).toContain("marketplace_publication_checks v");
    expect(sql).toContain("v.verified_at >= greatest(r.reviewed_at, t.reviewed_at)");
    expect(sql).toContain("a.id = v.pdf_asset_id");
    expect(sql).toContain("a.id = v.cover_asset_id");
    expect(sql).toContain("published_revision_id = b.current_revision_id");
    expect(values).toEqual([bookId, revisionId]);
  });

  it("requires a recorded five-part verification before publication", async () => {
    const publicationChecks = { identity: true, tax: true, rights: true, pdf: true, cover: true };
    await expect(moderateMarketplaceBook({ bookId, revisionId, action: "verify_publication", reason: "Evidencia corta", publicationChecks })).rejects.toThrow();
    await expect(moderateMarketplaceBook({ bookId, revisionId, action: "verify_publication",
      reason: "SII y archivos revisados el 15 de noviembre", publicationChecks: { ...publicationChecks, pdf: false } })).rejects.toThrow();
    expect(database).not.toHaveBeenCalled();

    expect(await moderateMarketplaceBook({ bookId, revisionId, action: "verify_publication",
      reason: "SII y archivos revisados el 15 de noviembre", publicationChecks })).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("insert into marketplace_publication_checks");
    expect(sql).toContain("b.status in ('approved', 'paused')");
    expect(sql).toContain("r.moderation_status = 'approved'");
    expect(sql).toContain("s.status = 'active'");
    expect(sql).toContain("t.review_status = 'verified'");
    expect(sql).toContain("r.rights_declaration_version is not null");
    expect(sql).toContain("a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'");
    expect(sql).toContain("a.asset_kind = 'cover' and a.scan_status = 'ready'");
    expect(sql).toContain("'verify_publication', 'marketplace_book'");
    expect(values).toEqual([bookId, revisionId, "SII y archivos revisados el 15 de noviembre"]);
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

  it("filters the live catalog with parameterized literal search and approved category", async () => {
    await listPublishedMarketplaceBooks(2, { query: "IA%", category: "ia" });
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("strpos(lower(concat_ws");
    expect(sql).toContain("r.category = $3");
    expect(values).toEqual([24, "IA%", "ia"]);
    expect(sql).toContain("cover.scan_status = 'ready'");
  });

  it("selects a cover only for a published approved revision with a ready PDF", async () => {
    await getPublishedMarketplaceCover(bookId);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("b.status = 'published'");
    expect(sql).toContain("r.moderation_status = 'approved'");
    expect(sql).toContain("a.asset_kind = 'cover' and a.scan_status = 'ready'");
    expect(sql).toContain("pdf.asset_kind = 'ebook_pdf' and pdf.scan_status = 'ready'");
    expect(values).toEqual([bookId]);
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
    expect(sql).toContain("pdf.id = v.pdf_asset_id");
    expect(sql).toContain("pdf.scan_status = 'ready'");
    expect(sql).toContain("cover.id = v.cover_asset_id");
    expect(values).toEqual([bookId, "ia"]);
  });
});
