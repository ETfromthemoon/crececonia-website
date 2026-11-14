import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest } from "@/lib/marketplace-seller-auth";

export const dynamic = "force-dynamic";

type SalesSummary = { sale_count: number; gross_minor: string; commission_minor: string };
type SellerSale = {
  order_item_id: string; order_id: string; title: string; price_minor: string; commission_minor: string;
  commission_tax_minor: string; gateway_fee_actual_minor: string | null;
  tax_minor: string; tax_mode: string; paid_at: string;
};

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
    const books = seller ? await queryDatabase<{ id: string; revision_id: string; slug: string; status: string; title: string; description: string; category: string; price_minor: number; has_pdf: boolean; has_cover: boolean }>(
      `select b.id, r.id as revision_id, b.slug, b.status, r.title, r.description, r.category, r.price_minor,
        exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'ebook_pdf' and a.scan_status <> 'rejected') as has_pdf,
        exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'cover' and a.scan_status <> 'rejected') as has_cover
       from marketplace_books b
       left join marketplace_book_revisions r on r.id = b.current_revision_id
       where b.seller_id = $1 order by b.created_at desc`, [seller.id]) : [];
    const [summaries, sales] = seller ? await Promise.all([
      queryDatabase<SalesSummary>(`select count(*)::integer as sale_count,
          coalesce(sum(i.price_minor), 0)::text as gross_minor,
          coalesce(sum(i.commission_minor), 0)::text as commission_minor
        from public.marketplace_order_items i
        join public.marketplace_orders o on o.id = i.order_id
        where i.seller_id = $1 and o.status = 'paid'`, [seller.id]),
      queryDatabase<SellerSale>(`select i.id as order_item_id, o.id as order_id, r.title, i.price_minor::text,
          i.commission_minor::text, i.commission_tax_minor::text,
          i.tax_minor::text, i.tax_mode, o.paid_at,
          (select p.gateway_fee_actual_minor::text from public.marketplace_payments p
           where p.order_id = o.id and p.status = 'confirmed'
           order by p.attempt_number desc limit 1) as gateway_fee_actual_minor
        from public.marketplace_order_items i
        join public.marketplace_orders o on o.id = i.order_id
        join public.marketplace_book_revisions r on r.id = i.revision_id
        where i.seller_id = $1 and o.status = 'paid'
        order by o.paid_at desc, o.id desc limit 20`, [seller.id]),
    ]) : [[], []];
    return NextResponse.json({ seller, taxProfile: taxProfiles[0] ?? null, books,
      salesSummary: summaries[0] ?? { sale_count: 0, gross_minor: "0", commission_minor: "0" },
      recentSales: sales,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("marketplace_seller_dashboard_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo cargar el panel", { status: 503 });
  }
}
