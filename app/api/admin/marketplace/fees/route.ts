import { isAdminRequest } from "@/lib/admin-session";
import { queryDatabase } from "@/lib/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type EvidenceRow = { evidence_id: string; recorded: boolean };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Identifies paid Flow transactions whose actual processor fee still needs evidence. */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const payments = await queryDatabase(`select p.id as payment_id, o.id as order_id,
        o.total_minor::text, o.paid_at::text, p.gateway_fee_actual_minor::text,
        i.seller_id, r.title
      from public.marketplace_payments p
      join public.marketplace_orders o on o.id = p.order_id
      join public.marketplace_order_items i on i.order_id = o.id
      join public.marketplace_book_revisions r on r.id = i.revision_id
      where p.provider = 'flow' and p.provider_account_ref = 'crececonia'
        and p.status in ('confirmed', 'refunded', 'disputed')
        and o.status in ('paid', 'refunded', 'disputed')
        and (p.gateway_fee_actual_minor is null
          or (p.gateway_fee_actual_minor > 0 and (
            not exists (select 1 from public.marketplace_ledger_entries l
              where l.payment_id=p.id and l.source_type='gateway_fee_actual'
                and l.account_code='seller_payable'
                and l.debit_minor=p.gateway_fee_actual_minor)
            or not exists (select 1 from public.marketplace_ledger_entries l
              where l.payment_id=p.id and l.source_type='gateway_fee_actual'
                and l.account_code='processor_clearing'
                and l.credit_minor=p.gateway_fee_actual_minor))))
      order by o.paid_at asc limit 100`);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error("[marketplace/fees/pending]", error);
    return NextResponse.json({ error: "No se pudo consultar tarifas pendientes." }, { status: 503 });
  }
}

/** Records an actual fee already verified against a Flow statement. */
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const paymentId = body?.paymentId;
  const amount = body?.amountMinor;
  const reference = typeof body?.statementReference === "string" ? body.statementReference.trim() : null;
  const note = typeof body?.evidenceNote === "string" ? body.evidenceNote.trim() : null;
  if (typeof paymentId !== "string" || !uuid.test(paymentId)
    || !Number.isSafeInteger(amount) || (amount as number) < 0
    || !reference || reference.length < 3 || reference.length > 120 || /[\r\n\t<>]/.test(reference)
    || !note || note.length < 20 || note.length > 2000 || body?.confirmedStatement !== true) {
    return NextResponse.json({ error: "Confirma la tarifa y su referencia del estado Flow." }, { status: 400 });
  }
  try {
    const [evidence] = await queryDatabase<EvidenceRow>(`
      select evidence_id, recorded from public.marketplace_record_gateway_fee($1,$2,$3,$4)`,
      [paymentId, amount, reference, note]);
    if (!evidence) return NextResponse.json({ error: "Pago no elegible o evidencia contradictoria." }, { status: 409 });
    return NextResponse.json({ id: evidence.evidence_id, status: "recorded" },
      { status: evidence.recorded ? 201 : 200 });
  } catch (error) {
    console.error("[marketplace/fees/record]", error);
    return NextResponse.json({ error: "No se pudo registrar la tarifa Flow." }, { status: 503 });
  }
}
