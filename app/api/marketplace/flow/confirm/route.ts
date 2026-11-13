import { createHash } from "node:crypto";
import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";
import { sendMarketplaceDelivery } from "@/lib/marketplace-delivery";
import { marketplaceSandboxConfigured, normalizeBuyerEmail } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";

type FlowStatus = { status: number; payer: string; amount: string | number; flowOrder: number; commerceOrder: string };
type OrderRow = {
  id: string; buyer_email: string; status: string; total_minor: string | number;
  item_id: string; price_minor: string | number; commission_minor: string | number;
  title: string; paid_at: string | null;
};

async function getFlowStatus(token: string): Promise<FlowStatus> {
  const apiKey = process.env.FLOW_API_KEY!;
  const params = { apiKey, token };
  const url = new URL(`${getFlowBase()}/payment/getStatus`);
  for (const [key, value] of Object.entries({ ...params, s: flowSign(params, process.env.FLOW_SECRET_KEY!) })) url.searchParams.set(key, value);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Flow no confirmó el estado de pago.");
  const payment: unknown = await response.json();
  if (!payment || typeof payment !== "object" || !("status" in payment) || typeof payment.status !== "number" || ![1, 2, 3, 4].includes(payment.status)) {
    throw new Error("Estado de Flow inválido.");
  }
  return payment as FlowStatus;
}

async function deliver(orderId: string): Promise<void> {
  const [row] = await queryDatabase<{
    id: string; buyer_email: string; paid_at: string; item_id: string; title: string; outbox_status: string;
  }>(`
    select o.id,o.buyer_email,o.paid_at,i.id as item_id,r.title,x.status as outbox_status
    from public.marketplace_orders o
    join public.marketplace_order_items i on i.order_id=o.id
    join public.marketplace_book_revisions r on r.id=i.revision_id
    join public.marketplace_entitlements e on e.order_item_id=i.id and e.status='active'
    join public.marketplace_outbox x on x.idempotency_key='marketplace-delivery/'||o.id::text
    where o.id=$1 and o.status='paid'`, [orderId]);
  if (!row) throw new Error("La orden pagada no tiene entrega completa.");
  if (row.outbox_status === "succeeded") return;
  await sendMarketplaceDelivery({ orderId: row.id, itemId: row.item_id, buyerEmail: row.buyer_email, title: row.title, paidAt: row.paid_at });
  await queryDatabase(`update public.marketplace_outbox set status='succeeded',completed_at=now(),attempts=attempts+1
    where idempotency_key=$1 and status<>'succeeded'`, [`marketplace-delivery/${orderId}`]);
}

export async function POST(request: Request): Promise<Response> {
  // Disabling new checkouts must not abandon an already paid sandbox order.
  if (!marketplaceSandboxConfigured()) return new Response("UNAVAILABLE", { status: 503 });
  try {
    const params = new URLSearchParams(await request.text());
    const token = params.get("token");
    if (!token || token.length > 500) return new Response("BAD REQUEST", { status: 400 });
    const payment = await getFlowStatus(token);
    if (payment.status !== 2) return new Response("OK");
    const match = /^mkt-([0-9a-f-]{36})$/.exec(payment.commerceOrder ?? "");
    const buyer = normalizeBuyerEmail(payment.payer);
    const amount = Number(payment.amount);
    if (!match || !buyer || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(payment.flowOrder)) {
      throw new Error("Flow devolvió un pago sin identidad o monto válido.");
    }
    const orderId = match[1];
    const [order] = await queryDatabase<OrderRow>(`
      select o.id,o.buyer_email,o.status,o.total_minor,o.paid_at,i.id as item_id,
             i.price_minor,i.commission_minor,r.title
      from public.marketplace_orders o
      join public.marketplace_order_items i on i.order_id=o.id
      join public.marketplace_book_revisions r on r.id=i.revision_id
      where o.id=$1`, [orderId]);
    if (!order || Number(order.total_minor) !== amount || Number(order.price_minor) !== amount || order.buyer_email !== buyer) {
      throw new Error("El pago no coincide con la orden preparada.");
    }
    const [existing] = await queryDatabase<{ id: string; provider_payment_ref: string; status: string }>(`
      select id,provider_payment_ref,status from public.marketplace_payments
      where order_id=$1 and attempt_number=1`, [orderId]);
    if (existing && existing.provider_payment_ref !== token) {
      await queryDatabase("update public.marketplace_orders set status='review_required' where id=$1 and status<>'refunded'", [orderId]);
      throw new Error("La orden tiene otra transacción de Flow y requiere conciliación.");
    }
    const [record] = await queryDatabase<{ id: string }>(`
      insert into public.marketplace_payments
        (order_id,provider,provider_account_ref,provider_payment_ref,attempt_number,amount_minor,status,confirmed_at)
      values ($1,'flow','crececonia',$2,1,$3,'confirmed',now())
      on conflict (provider,provider_payment_ref) do update
        set status='confirmed',confirmed_at=coalesce(marketplace_payments.confirmed_at,now())
        where marketplace_payments.order_id=excluded.order_id
      returning id`, [orderId, token, amount]);
    if (!record) throw new Error("No se registró el pago.");
    const digest = createHash("sha256").update(`${orderId}:${token}:${amount}:2`).digest("hex");
    await queryDatabase(`insert into public.marketplace_payment_events
      (payment_id,provider,provider_event_ref,event_type,payload_digest,processing_status,processed_at)
      values ($1,'flow',$2,'payment_confirmed',$3,'processed',now())
      on conflict (provider,provider_event_ref) do nothing`, [record.id, `${payment.flowOrder}:paid`, digest]);
    const [paid] = await queryDatabase<{ id: string }>(`
      update public.marketplace_orders set status='paid',paid_at=coalesce(paid_at,now())
      where id=$1 and status in ('pending','paid') returning id`, [orderId]);
    if (!paid) throw new Error("La orden no admite confirmación automática.");
    await queryDatabase(`insert into public.marketplace_entitlements
      (order_item_id,buyer_email,book_id,status)
      select i.id,o.buyer_email,i.book_id,'active'
      from public.marketplace_order_items i join public.marketplace_orders o on o.id=i.order_id
      where o.id=$1 and o.status='paid'
      on conflict (order_item_id) do nothing`, [orderId]);
    // The 5% platform commission is booked on gross CLP. Gateway fee is
    // reconciled later against the processor statement and charged to seller.
    const sellerPayable = amount - Number(order.commission_minor);
    await queryDatabase(`insert into public.marketplace_ledger_entries
      (journal_id,order_id,order_item_id,payment_id,account_code,debit_minor,credit_minor,source_type,source_ref)
      values
      ($1,$1,$2,$3,'processor_clearing',$4,0,'payment_confirmed',$1::text),
      ($1,$1,$2,$3,'seller_payable',0,$5,'payment_confirmed',$1::text),
      ($1,$1,$2,$3,'platform_commission',0,$6,'payment_confirmed',$1::text)
      on conflict (journal_id,account_code,source_type,source_ref) do nothing`,
      [orderId, order.item_id, record.id, amount, sellerPayable, Number(order.commission_minor)]);
    await queryDatabase(`insert into public.marketplace_outbox
      (event_type,aggregate_type,aggregate_id,idempotency_key,payload)
      values ('purchase_delivery','order',$1,$2,'{}'::jsonb)
      on conflict (idempotency_key) do nothing`, [orderId, `marketplace-delivery/${orderId}`]);
    await deliver(orderId);
    return new Response("OK");
  } catch (error) {
    console.error("[marketplace/flow/confirm] la confirmación requiere reintento", error);
    return new Response("RETRY", { status: 500 });
  }
}
