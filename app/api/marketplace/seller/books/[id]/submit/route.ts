import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  const identityId = sellerIdentityFromRequest(request)!;
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Libro inválido", { status: 400 });
  try {
    const rows = await queryDatabase<{ id: string }>(`with changed as (update marketplace_books b set status = 'in_review', updated_at = now()
      from marketplace_sellers s, marketplace_book_revisions r
      where b.id = $1 and b.seller_id = s.id and s.owner_user_id = $2
        and s.status in ('pending_verification','active')
        and b.status in ('draft','changes_requested')
        and r.id = b.current_revision_id and r.moderation_status = 'pending' and r.rights_declared_at is not null
        and exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'ebook_pdf' and a.scan_status = 'quarantined')
        and exists (select 1 from marketplace_assets a where a.revision_id = r.id and a.asset_kind = 'cover' and a.scan_status = 'quarantined')
      returning b.id), audit as (
        insert into marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
        select $2, 'book_submitted_for_review', 'book', id from changed
        returning entity_id as id
      ) select id from audit`, [id, identityId]);
    if (!rows[0]) return new Response("Completa el PDF y la portada antes de solicitar revisión", { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("marketplace_seller_submit_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo enviar a revisión", { status: 503 });
  }
}
