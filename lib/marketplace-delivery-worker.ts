import "server-only";
import { randomUUID } from "node:crypto";
import { queryDatabase } from "./database";
import { sendMarketplaceDelivery } from "./marketplace-delivery";

type Job = { id: string; aggregate_id: string; claim_token: string; attempts: number };

export async function processMarketplaceDeliveryBatch(limit = 10): Promise<{ claimed: number; delivered: number; failed: number }> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Límite inválido.");
  const result = { claimed: 0, delivered: 0, failed: 0 };
  for (let index = 0; index < limit; index++) {
    const claimToken = randomUUID();
    const [job] = await queryDatabase<Job>(`with candidate as (
      select id from public.marketplace_outbox
      where event_type='purchase_delivery' and available_at<=now() and attempts<8
        and (status in ('pending','failed') or (status='processing' and lease_until<now()))
      order by available_at,id limit 1 for update skip locked
    ) update public.marketplace_outbox o
      set status='processing',lease_until=now()+interval '2 minutes',claim_token=$1,attempts=o.attempts+1
      from candidate c where o.id=c.id returning o.id,o.aggregate_id,o.claim_token,o.attempts`, [claimToken]);
    if (!job) break;
    result.claimed++;
    try {
      const [row] = await queryDatabase<{ id: string; buyer_email: string; paid_at: string; item_id: string; title: string }>(`
        select o.id,o.buyer_email,o.paid_at,i.id as item_id,r.title
        from public.marketplace_orders o
        join public.marketplace_order_items i on i.order_id=o.id
        join public.marketplace_book_revisions r on r.id=i.revision_id
        join public.marketplace_entitlements e on e.order_item_id=i.id and e.status='active'
        where o.id=$1 and o.status='paid'`, [job.aggregate_id]);
      if (!row) throw new Error("La orden pagada no tiene entrega completa.");
      await sendMarketplaceDelivery({ orderId: row.id, itemId: row.item_id, buyerEmail: row.buyer_email, title: row.title, paidAt: row.paid_at });
      const [closed] = await queryDatabase<{ id: string }>(`update public.marketplace_outbox
        set status='succeeded',completed_at=now(),lease_until=null,claim_token=null
        where id=$1 and status='processing' and claim_token=$2 returning id`, [job.id, claimToken]);
      if (!closed) throw new Error("Se perdió la reserva de entrega.");
      result.delivered++;
    } catch (error) {
      console.error("[marketplace-delivery] fallo de entrega", error);
      await queryDatabase(`update public.marketplace_outbox
        set status=case when attempts>=8 then 'dead_letter' else 'failed' end,
            available_at=now()+make_interval(mins=>least(60,attempts*attempts)),
            lease_until=null,claim_token=null,last_error_code='delivery_failed'
        where id=$1 and status='processing' and claim_token=$2`, [job.id, claimToken]);
      result.failed++;
    }
  }
  return result;
}
