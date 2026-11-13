import "server-only";
import { queryDatabase } from "@/lib/database";
import { downloadPrivateObject } from "@/lib/private-storage";
import { validateMarketplacePdf } from "@/lib/marketplace-asset-validation";

export type ReviewAction = "approve" | "request_changes" | "reject" | "publish" | "pause";

export type ReviewRow = {
  book_id: string;
  revision_id: string;
  published_revision_id: string | null;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  author_display_name: string;
  category: string;
  seller_name: string;
  seller_status: string;
  book_status: string;
  moderation_status: string;
  price_minor: string;
  price_tax_mode: string;
  rights_declared_at: string | null;
  rights_declaration_version: string | null;
  ready_pdf: boolean;
  moderation_reason: string | null;
};

export type ReviewAsset = {
  id: string;
  book_id: string;
  revision_id: string;
  asset_kind: string;
  storage_key: string;
  content_type: string;
  byte_size: string;
  sha256: string;
  scan_status: string;
};

export async function listMarketplaceReviewAssets(): Promise<ReviewAsset[]> {
  return queryDatabase<ReviewAsset>(`
    select a.id, a.book_id, a.revision_id, a.asset_kind, a.storage_key,
      a.content_type, a.byte_size::text, a.sha256, a.scan_status
    from marketplace_assets a
    join marketplace_books b on b.id = a.book_id and b.current_revision_id = a.revision_id
    where b.status in ('in_review', 'approved', 'published', 'paused')
    order by a.created_at desc limit 300
  `);
}

export async function getMarketplaceReviewAsset(assetId: string): Promise<ReviewAsset | null> {
  if (!UUID.test(assetId)) return null;
  const rows = await queryDatabase<ReviewAsset>(`
    select a.id, a.book_id, a.revision_id, a.asset_kind, a.storage_key,
      a.content_type, a.byte_size::text, a.sha256, a.scan_status
    from marketplace_assets a
    join marketplace_books b on b.id = a.book_id and b.current_revision_id = a.revision_id
    where a.id = $1 and a.asset_kind = 'ebook_pdf'
    limit 1
  `, [assetId]);
  return rows[0] ?? null;
}

export async function readMarketplaceReviewPdf(asset: ReviewAsset): Promise<Blob> {
  if (asset.asset_kind !== "ebook_pdf"
    || asset.content_type !== "application/pdf"
    || !/^marketplace\/quarantine\/[a-f0-9-]+\/[a-f0-9-]+\/[a-f0-9-]+\.pdf$/i.test(asset.storage_key)) {
    throw new Error("El archivo no corresponde a un PDF del marketplace.");
  }
  const { data, error } = await downloadPrivateObject("ebooks", asset.storage_key);
  if (error || !data) throw new Error("No se pudo obtener el PDF privado.");
  const issue = validateMarketplacePdf(new Uint8Array(await data.arrayBuffer()), asset.byte_size, asset.sha256);
  if (issue) throw new Error(issue);
  return data;
}

export async function reviewMarketplacePdf(
  assetId: string, action: "accept" | "reject", reason: string,
): Promise<boolean> {
  const asset = await getMarketplaceReviewAsset(assetId);
  if (!asset || asset.scan_status !== "quarantined") return false;
  const explanation = reason.trim();
  if (explanation.length < 10 || explanation.length > 2000) {
    throw new Error("Indica un motivo de 10 a 2000 caracteres.");
  }
  if (action === "accept") await readMarketplaceReviewPdf(asset);
  const status = action === "accept" ? "ready" : "rejected";
  const result = await queryDatabase<{ id: string }>(`
    with changed as (
      update marketplace_assets
      set scan_status = $2
      where id = $1 and scan_status = 'quarantined'
        and storage_key = $3 and sha256 = $4 and byte_size = $5
      returning id
    ), audit as (
      insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
      select 'admin', $6, 'marketplace_asset', id, $7 from changed
      returning entity_id as id
    ) select id from audit
  `, [assetId, status, asset.storage_key, asset.sha256, asset.byte_size, action, explanation]);
  return result.length === 1;
}

export type PublishedBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  author_display_name: string;
  category: "ia" | "tecnologia" | "negocios";
  price_minor: string;
  seller_name: string;
  seller_slug: string;
};

export type SellerReview = {
  id: string;
  public_slug: string;
  display_name: string;
  bio: string;
  status: string;
  terms_version: string | null;
  terms_accepted_at: string | null;
  rut: string | null;
  legal_name: string | null;
  declared_vat_status: string | null;
  tax_review_status: string | null;
};

export async function listSellerReviews(): Promise<SellerReview[]> {
  return queryDatabase<SellerReview>(`
    select s.id, s.public_slug, s.display_name, s.bio, s.status,
      s.terms_version, s.terms_accepted_at, t.rut, t.legal_name,
      t.declared_vat_status, t.review_status as tax_review_status
    from marketplace_sellers s
    left join marketplace_seller_tax_profiles t on t.seller_id = s.id
    where status in ('pending_verification', 'active', 'suspended')
    order by case s.status when 'pending_verification' then 0 else 1 end, s.updated_at desc
    limit 100
  `);
}

export async function setMarketplaceSellerStatus(
  sellerId: string,
  action: "activate" | "suspend",
  reason: string,
): Promise<boolean> {
  if (!UUID.test(sellerId)) throw new Error("Identificador inválido.");
  const explanation = reason.trim();
  if (explanation.length < 10 || explanation.length > 2000) {
    throw new Error("Indica un motivo de 10 a 2000 caracteres.");
  }
  const current = action === "activate" ? "pending_verification" : "active";
  const next = action === "activate" ? "active" : "suspended";
  const result = await queryDatabase<{ id: string }>(`
    with changed as (
      update marketplace_sellers s
      set status = $2, updated_at = now()
      where s.id = $1 and s.status = $3
        and ($4::text <> 'activate' or (
          s.terms_version is not null and s.terms_accepted_at is not null
          and exists (
            select 1 from marketplace_seller_tax_profiles t
            where t.seller_id = s.id and t.review_status = 'verified'
          )
        ))
      returning id
    ), audit as (
      insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
      select 'admin', $4, 'marketplace_seller', id, $5 from changed
      returning entity_id as id
    ) select id from audit
  `, [sellerId, next, current, action, explanation]);
  return result.length === 1;
}

export async function verifyMarketplaceSellerTax(
  sellerId: string, action: "verify" | "reject", reason: string,
): Promise<boolean> {
  if (!UUID.test(sellerId)) throw new Error("Identificador inválido.");
  const explanation = reason.trim();
  if (explanation.length < 10 || explanation.length > 2000) {
    throw new Error("Indica la comprobación SII y su resultado en 10 a 2000 caracteres.");
  }
  const next = action === "verify" ? "verified" : "rejected";
  const result = await queryDatabase<{ id: string }>(`
    with changed as (
      update marketplace_seller_tax_profiles t
      set review_status = $2, reviewed_by = 'admin', reviewed_at = now()
      where t.seller_id = $1 and t.review_status = 'pending'
        and t.rut is not null and t.legal_name is not null
        and ($3 <> 'verify' or t.declared_vat_status <> 'unsure')
      returning t.seller_id as id
    ), audit as (
      insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
      select 'admin', $3, 'marketplace_seller_tax', id, $4 from changed
      returning entity_id as id
    ) select id from audit
  `, [sellerId, next, action, explanation]);
  return result.length === 1;
}

export async function setMarketplaceBookTaxMode(
  bookId: string, revisionId: string, taxMode: "tax_inclusive" | "exempt", reason: string,
): Promise<boolean> {
  if (!UUID.test(bookId) || !UUID.test(revisionId)) throw new Error("Identificador inválido.");
  const explanation = reason.trim();
  if (explanation.length < 10 || explanation.length > 2000) {
    throw new Error("Documenta la decisión tributaria en 10 a 2000 caracteres.");
  }
  const result = await queryDatabase<{ id: string }>(`
    with changed as (
      update marketplace_book_revisions r
      set price_tax_mode = $3
      from marketplace_books b, marketplace_seller_tax_profiles t
      where b.id = $1 and b.current_revision_id = $2 and r.id = $2
        and r.book_id = b.id and b.status = 'in_review'
        and r.moderation_status = 'pending'
        and r.price_tax_mode = 'pending_review'
        and t.seller_id = b.seller_id and t.review_status = 'verified'
      returning r.id
    ), audit as (
      insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
      select 'admin', 'set_tax_mode:' || $3, 'marketplace_book_revision', id, $4 from changed
      returning entity_id as id
    ) select id from audit
  `, [bookId, revisionId, taxMode, explanation]);
  return result.length === 1;
}

export async function listMarketplaceReviews(): Promise<ReviewRow[]> {
  return queryDatabase<ReviewRow>(`
    select b.id as book_id, r.id as revision_id, b.published_revision_id, b.slug, r.title,
      r.subtitle, r.description, r.author_display_name, r.category,
      s.display_name as seller_name, s.status as seller_status,
      b.status as book_status, r.moderation_status, r.price_minor::text,
      r.price_tax_mode, r.rights_declared_at, r.rights_declaration_version,
      r.moderation_reason,
      exists (
        select 1 from marketplace_assets a
        where a.book_id = b.id and a.revision_id = r.id
          and a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'
      ) as ready_pdf
    from marketplace_books b
    join marketplace_book_revisions r on r.id = b.current_revision_id
    join marketplace_sellers s on s.id = b.seller_id
    where b.status in ('in_review', 'approved', 'published', 'paused')
    order by case b.status when 'in_review' then 0 when 'approved' then 1 else 2 end,
      b.updated_at desc
    limit 100
  `);
}

export async function listPublishedMarketplaceBooks(page = 1): Promise<PublishedBook[]> {
  if (!Number.isSafeInteger(page) || page < 1 || page > Math.floor(Number.MAX_SAFE_INTEGER / 24)) throw new Error("Página inválida.");
  return queryDatabase<PublishedBook>(`
    select b.id, b.slug, r.title, r.subtitle, r.description,
      r.author_display_name, r.category, r.price_minor::text,
      s.display_name as seller_name, s.public_slug as seller_slug
    from marketplace_books b
    join marketplace_sellers s on s.id = b.seller_id and s.status = 'active'
    join marketplace_seller_tax_profiles t on t.seller_id = s.id and t.review_status = 'verified'
    join marketplace_book_revisions r on r.id = b.published_revision_id
      and r.book_id = b.id and r.moderation_status = 'approved'
    where b.status = 'published'
      and r.rights_declared_at is not null
      and r.price_tax_mode in ('tax_inclusive', 'exempt')
      and exists (
        select 1 from marketplace_assets a
        where a.book_id = b.id and a.revision_id = r.id
          and a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'
      )
    order by b.published_at desc, b.id desc
    limit 25 offset $1
  `, [(page - 1) * 24]);
}

export async function getPublishedMarketplaceBook(slug: string): Promise<PublishedBook | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const books = await queryDatabase<PublishedBook>(`
    select b.id, b.slug, r.title, r.subtitle, r.description,
      r.author_display_name, r.category, r.price_minor::text,
      s.display_name as seller_name, s.public_slug as seller_slug
    from marketplace_books b
    join marketplace_sellers s on s.id = b.seller_id and s.status = 'active'
    join marketplace_seller_tax_profiles t on t.seller_id = s.id and t.review_status = 'verified'
    join marketplace_book_revisions r on r.id = b.published_revision_id
      and r.book_id = b.id and r.moderation_status = 'approved'
    where b.slug = $1 and b.status = 'published'
      and r.rights_declared_at is not null
      and r.price_tax_mode in ('tax_inclusive', 'exempt')
      and exists (
        select 1 from marketplace_assets a
        where a.book_id = b.id and a.revision_id = r.id
          and a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'
      )
    limit 1
  `, [slug]);
  return books[0] ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function moderateMarketplaceBook(input: {
  bookId: string;
  revisionId: string;
  action: ReviewAction;
  reason?: string;
}): Promise<boolean> {
  const { bookId, revisionId, action } = input;
  const reason = input.reason?.trim() ?? "";
  if (!UUID.test(bookId) || !UUID.test(revisionId)) throw new Error("Identificador inválido.");
  if (reason.length > 2000) throw new Error("Motivo demasiado largo.");
  if (["request_changes", "reject"].includes(action) && reason.length < 10) {
    throw new Error("Explica el cambio o rechazo en al menos 10 caracteres.");
  }

  if (action === "pause") {
    const result = await queryDatabase<{ id: string }>(`
      with changed as (
        update marketplace_books
        set status = 'paused', updated_at = now()
        where id = $1 and published_revision_id = $2 and status = 'published'
        returning id
      ), audit as (
        insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
        select 'admin', 'pause', 'marketplace_book', id, $3 from changed
        returning entity_id as id
      ) select id from audit
    `, [bookId, revisionId, reason || null]);
    return result.length === 1;
  }

  if (action === "publish") {
    const result = await queryDatabase<{ id: string }>(`
      with changed as (
        update marketplace_books b
        set status = 'published', published_revision_id = b.current_revision_id,
          published_at = now(), updated_at = now()
        from marketplace_book_revisions r, marketplace_sellers s,
          marketplace_seller_tax_profiles t
        where b.id = $1 and b.current_revision_id = $2 and r.id = $2
          and r.book_id = b.id and s.id = b.seller_id
          and b.status in ('approved', 'paused')
          and s.status = 'active' and s.terms_accepted_at is not null
          and t.seller_id = s.id and t.review_status = 'verified'
          and r.moderation_status = 'approved'
          and r.rights_declared_at is not null
          and r.price_tax_mode in ('tax_inclusive', 'exempt')
          and exists (
            select 1 from marketplace_assets a
            where a.book_id = b.id and a.revision_id = r.id
              and a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'
          )
        returning b.id
      ), audit as (
        insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id)
        select 'admin', 'publish', 'marketplace_book', id from changed
        returning entity_id as id
      ) select id from audit
    `, [bookId, revisionId]);
    return result.length === 1;
  }

  if (action !== "approve" && action !== "request_changes" && action !== "reject") {
    throw new Error("Acción no válida.");
  }
  const nextModeration = action === "approve" ? "approved"
    : action === "reject" ? "rejected" : "changes_requested";
  const nextBook = action === "approve" ? "approved"
    : action === "reject" ? "archived" : "changes_requested";
  const result = await queryDatabase<{ id: string }>(`
    with eligible as (
      select b.id
      from marketplace_books b
      join marketplace_book_revisions r on r.id = b.current_revision_id and r.book_id = b.id
      join marketplace_sellers s on s.id = b.seller_id
      left join marketplace_seller_tax_profiles t on t.seller_id = s.id
      where b.id = $1 and r.id = $2
        and b.status = 'in_review' and r.moderation_status = 'pending'
        and (
          $3::text <> 'approve'
          or (
            t.review_status = 'verified'
            and r.rights_declared_at is not null
            and r.price_tax_mode in ('tax_inclusive', 'exempt')
            and exists (
              select 1 from marketplace_assets a
              where a.book_id = b.id and a.revision_id = r.id
                and a.asset_kind = 'ebook_pdf' and a.scan_status = 'ready'
            )
          )
        )
    ), revision_changed as (
      update marketplace_book_revisions r
      set moderation_status = $4, moderation_reason = $5,
        reviewed_by = 'admin', reviewed_at = now()
      from eligible e where r.id = $2 and r.book_id = e.id
      returning r.book_id
    ), book_changed as (
      update marketplace_books b
      set status = $6, updated_at = now()
      from revision_changed r where b.id = r.book_id
      returning b.id
    ), audit as (
      insert into marketplace_audit_log(actor_user_id, action, entity_type, entity_id, reason)
      select 'admin', $3, 'marketplace_book', id, $5 from book_changed
      returning entity_id as id
    ) select id from audit
  `, [bookId, revisionId, action, nextModeration, reason || null, nextBook]);
  return result.length === 1;
}
