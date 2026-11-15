import { isAdminRequest } from "@/lib/admin-session";
import { queryDatabase } from "@/lib/database";
import { MARKETPLACE_FLOW_ACCOUNT_REF } from "@/lib/marketplace-checkout";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type PendingOrder = { order_id: string; total_minor: string; paid_at: string };
type Evidence = { id: string; inserted: boolean };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/** Lists originally paid orders that still need a voucher or boleta reference. No buyer PII. */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const orders = await queryDatabase<PendingOrder>(`
      select o.id as order_id, o.total_minor::text, o.paid_at::text
      from public.marketplace_orders o
      where o.status in ('paid', 'refunded', 'disputed') and o.paid_at is not null
        and not exists (select 1 from public.marketplace_fiscal_evidence e where e.order_id = o.id)
      order by o.paid_at asc, o.id asc limit 100`);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[marketplace/fiscal/pending]", error);
    return NextResponse.json({ error: "No se pudo consultar la conciliación tributaria." }, { status: 503 });
  }
}

/** Records an externally issued document; never calls SII or emits a boleta. */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const orderId = body?.orderId;
  const kind = body?.documentKind;
  const reference = typeof body?.documentReference === "string" ? body.documentReference.trim() : null;
  const issuedAt = body?.issuedAt;
  if (typeof orderId !== "string" || !uuid.test(orderId) || (kind !== "voucher" && kind !== "boleta")
    || !reference || reference.length < 3 || reference.length > 120 || /[\r\n\t<>]/.test(reference)
    || typeof issuedAt !== "string" || !timestamp.test(issuedAt) || !Number.isFinite(Date.parse(issuedAt))) {
    return NextResponse.json({ error: "Datos del documento inválidos." }, { status: 400 });
  }
  try {
    const rows = await queryDatabase<Evidence>(`
      with eligible as (
        select o.id from public.marketplace_orders o
        where o.id = $1 and o.status in ('paid', 'refunded', 'disputed') and o.paid_at is not null
          and exists (
            select 1 from public.marketplace_payments p
            where p.order_id = o.id and p.provider = 'flow' and p.provider_account_ref = $5
              and p.status in ('confirmed', 'refunded', 'disputed')
              and p.currency = o.currency and p.amount_minor = o.total_minor
          )
      ), inserted as (
        insert into public.marketplace_fiscal_evidence
          (order_id, document_kind, document_reference, issued_at, recorded_by)
        select id, $2, $3, $4::timestamptz, 'admin' from eligible
        on conflict do nothing returning id
      ), audited as (
        insert into public.marketplace_audit_log
          (actor_user_id, action, entity_type, entity_id, metadata)
        select 'admin', 'fiscal_evidence_recorded', 'marketplace_order', $1::uuid,
          jsonb_build_object('evidence_id', id, 'document_kind', $2)
        from inserted returning id
      )
      select id, true as inserted from inserted
      union all
      select e.id, false as inserted from public.marketplace_fiscal_evidence e
      where e.order_id = $1 and e.document_kind = $2 and e.document_reference = $3
        and e.issued_at = $4::timestamptz and not exists (select 1 from inserted)
      limit 1`, [orderId, kind, reference, issuedAt, MARKETPLACE_FLOW_ACCOUNT_REF]);
    if (!rows[0]) return NextResponse.json({ error: "Orden no pagada o documento ya registrado con otros datos." }, { status: 409 });
    return NextResponse.json({ id: rows[0].id, status: "recorded" }, { status: rows[0].inserted ? 201 : 200 });
  } catch (error) {
    console.error("[marketplace/fiscal/record]", error);
    return NextResponse.json({ error: "No se pudo registrar la evidencia tributaria." }, { status: 503 });
  }
}
