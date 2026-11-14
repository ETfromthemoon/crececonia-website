import { queryDatabase } from "./database";
import { sendMarketplaceDelivery } from "./marketplace-delivery";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 5;

/** Claims one delivery atomically; concurrent callbacks and cron runs cannot send it twice. */
export async function deliverMarketplaceOrder(orderId: string): Promise<"sent" | "already_sent"> {
  const outboxKey = `marketplace-delivery/${orderId}`;
  const [claim] = await queryDatabase<{ id: string; lease_until: string }>(`
    update public.marketplace_outbox
    set status='processing',lease_until=now()+interval '2 minutes',attempts=attempts+1
    where idempotency_key=$1 and event_type='purchase_delivery'
      and aggregate_type='order' and aggregate_id=$2
      and available_at<=now() and attempts<$3 and
      (status in ('pending','failed') or (status='processing' and lease_until<now()))
    returning id,lease_until`, [outboxKey, orderId, MAX_ATTEMPTS]);
  if (!claim) {
    const [state] = await queryDatabase<{ status: string }>(
      "select status from public.marketplace_outbox where idempotency_key=$1", [outboxKey]);
    if (state?.status === "succeeded") return "already_sent";
    throw new Error("La entrega no está disponible para reintento automático.");
  }
  try {
    const [row] = await queryDatabase<{
      id: string; buyer_email: string; paid_at: string; item_id: string; title: string;
    }>(`
      select o.id,o.buyer_email,o.paid_at,i.id as item_id,r.title
      from public.marketplace_orders o
      join public.marketplace_order_items i on i.order_id=o.id
      join public.marketplace_book_revisions r on r.id=i.revision_id
      join public.marketplace_entitlements e on e.order_item_id=i.id and e.status='active'
      where o.id=$1 and o.status='paid'`, [orderId]);
    if (!row) throw new Error("La orden pagada no tiene entrega completa.");
    await sendMarketplaceDelivery({ orderId: row.id, itemId: row.item_id, buyerEmail: row.buyer_email, title: row.title, paidAt: row.paid_at });
    const [completed] = await queryDatabase<{ id: string }>(`update public.marketplace_outbox
      set status='succeeded',completed_at=now(),lease_until=null
      where id=$1 and status='processing' and lease_until=$2 returning id`, [claim.id, claim.lease_until]);
    if (!completed) throw new Error("La entrega no pudo cerrar su reserva.");
    return "sent";
  } catch (error) {
    await queryDatabase(`update public.marketplace_outbox
      set status=case when attempts >= $3 then 'dead_letter' else 'failed' end,
          available_at=now()+interval '5 minutes',lease_until=null,last_error_code='delivery_failed'
      where id=$1 and status='processing' and lease_until=$2`, [claim.id, claim.lease_until, MAX_ATTEMPTS]).catch(() => undefined);
    throw error;
  }
}

/** Bounded recovery of paid purchases that were not emailed by the callback. */
export async function deliverMarketplaceOutboxBatch(): Promise<{ attempted: number; sent: number; failed: number }> {
  const candidates = await queryDatabase<{ aggregate_id: string }>(`
    select aggregate_id from public.marketplace_outbox
    where event_type='purchase_delivery' and aggregate_type='order'
      and attempts<$1 and available_at<=now()
      and (status in ('pending','failed') or (status='processing' and lease_until<now()))
    order by available_at,id limit $2`, [MAX_ATTEMPTS, BATCH_SIZE]);
  let sent = 0;
  let failed = 0;
  for (const candidate of candidates) {
    try {
      if (await deliverMarketplaceOrder(candidate.aggregate_id) === "sent") sent++;
    } catch {
      failed++;
    }
  }
  return { attempted: candidates.length, sent, failed };
}
