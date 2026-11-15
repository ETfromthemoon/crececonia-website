import { isAdminRequest } from "@/lib/admin-session";
import { queryDatabase } from "@/lib/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ReversalRow = { reversal_id: string; recorded: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Lists recent externally recorded reversals and paid orders eligible for review. */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const [eligible, reversals] = await Promise.all([
      queryDatabase(`select p.id as payment_id, o.id as order_id, o.total_minor::text,
          o.paid_at::text, i.seller_id, r.title
        from public.marketplace_payments p
        join public.marketplace_orders o on o.id = p.order_id
        join public.marketplace_order_items i on i.order_id = o.id
        join public.marketplace_book_revisions r on r.id = i.revision_id
        where p.provider = 'flow' and p.provider_account_ref = 'crececonia'
          and p.status = 'confirmed' and o.status = 'paid'
        order by o.paid_at desc limit 100`),
      queryDatabase(`select f.id, f.payment_id, f.provider_refund_ref,
          f.amount_minor::text, f.reason_code, f.completed_at::text
        from public.marketplace_refunds f where f.status = 'succeeded'
        order by f.completed_at desc limit 100`),
    ]);
    return NextResponse.json({ eligible, reversals });
  } catch (error) {
    console.error("[marketplace/refunds/list]", error);
    return NextResponse.json({ error: "No se pudo consultar los reversos." }, { status: 503 });
  }
}

/** Only records a full reversal already confirmed in Flow or by the acquirer. */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const paymentId = body?.paymentId;
  const kind = body?.kind;
  const reference = typeof body?.providerReference === "string" ? body.providerReference.trim() : null;
  const evidenceNote = typeof body?.evidenceNote === "string" ? body.evidenceNote.trim() : null;
  if (typeof paymentId !== "string" || !uuid.test(paymentId)
    || (kind !== "refund" && kind !== "chargeback")
    || !reference || reference.length < 3 || reference.length > 120 || /[\r\n\t<>]/.test(reference)
    || !evidenceNote || evidenceNote.length < 20 || evidenceNote.length > 2000
    || body?.confirmedExternal !== true) {
    return NextResponse.json({ error: "Confirma el reverso externo y su referencia verificable." }, { status: 400 });
  }
  try {
    const [reversal] = await queryDatabase<ReversalRow>(`
      select reversal_id, recorded from public.marketplace_record_external_reversal($1,$2,$3,$4)`,
      [paymentId, reference, kind, evidenceNote]);
    if (!reversal) return NextResponse.json({ error: "Pago no elegible o referencia ya utilizada." }, { status: 409 });
    return NextResponse.json({ id: reversal.reversal_id, status: "recorded" },
      { status: reversal.recorded ? 201 : 200 });
  } catch (error) {
    console.error("[marketplace/refunds/record]", error);
    return NextResponse.json({ error: "No se pudo registrar el reverso." }, { status: 503 });
  }
}
