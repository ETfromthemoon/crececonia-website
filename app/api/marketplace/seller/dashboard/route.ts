import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest } from "@/lib/marketplace-seller-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identityId = sellerIdentityFromRequest(request);
  if (!identityId) return new Response("Acceso requerido", { status: 401 });
  try {
    const sellers = await queryDatabase<{ id: string; display_name: string; public_slug: string; bio: string; status: string }>(
      `select id, display_name, public_slug, bio, status from marketplace_sellers where owner_user_id = $1`, [identityId]);
    const seller = sellers[0] ?? null;
    const taxProfiles = seller ? await queryDatabase<{ rut: string; legal_name: string; declared_vat_status: string; review_status: string }>(
      `select rut, legal_name, declared_vat_status, review_status
       from marketplace_seller_tax_profiles where seller_id = $1`, [seller.id]) : [];
    const books = seller ? await queryDatabase<{ id: string; slug: string; status: string; title: string; description: string; category: string; price_minor: number; has_pdf: boolean; has_cover: boolean }>(
      `select b.id, b.slug, b.status, r.title, r.description, r.category, r.price_minor,
        exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'ebook_pdf' and a.scan_status <> 'rejected') as has_pdf,
        exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'cover' and a.scan_status <> 'rejected') as has_cover
       from marketplace_books b
       left join marketplace_book_revisions r on r.id = b.current_revision_id
       where b.seller_id = $1 order by b.created_at desc`, [seller.id]) : [];
    return NextResponse.json({ seller, taxProfile: taxProfiles[0] ?? null, books }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("marketplace_seller_dashboard_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo cargar el panel", { status: 503 });
  }
}
