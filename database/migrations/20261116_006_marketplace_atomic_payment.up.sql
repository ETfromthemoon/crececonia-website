begin;

-- Finalizes one verified Flow payment in one database transaction. Seller row
-- locking serializes payment, external reversals and manual settlements.
create function public.marketplace_finalize_flow_payment(
  p_order_id uuid, p_token text, p_amount bigint, p_buyer_email text,
  p_event_ref text, p_payload_digest text, p_gateway_fee bigint
) returns table(payment_id uuid, outcome text)
language plpgsql as $$
declare
  v_seller_id uuid;
  v_item_id uuid;
  v_payment_id uuid;
  v_payment_status text;
  v_order_status text;
  v_existing_fee bigint;
  v_effective_fee bigint;
  v_commission bigint;
begin
  if p_order_id is null or p_token is null or char_length(p_token) not between 1 and 500
     or p_amount is null or p_amount <= 0 or p_buyer_email is null
     or p_event_ref is null or char_length(p_event_ref) not between 3 and 200
     or p_payload_digest is null or p_payload_digest !~ '^[a-f0-9]{64}$'
     or (p_gateway_fee is not null and (p_gateway_fee < 0 or p_gateway_fee > p_amount)) then
    return;
  end if;
  select i.seller_id into v_seller_id
  from public.marketplace_order_items i where i.order_id = p_order_id;
  if v_seller_id is null then return; end if;
  perform 1 from public.marketplace_sellers where id = v_seller_id for update;

  select p.id, p.status, o.status, p.gateway_fee_actual_minor,
         i.id, i.commission_minor
    into v_payment_id, v_payment_status, v_order_status, v_existing_fee,
         v_item_id, v_commission
  from public.marketplace_payments p
  join public.marketplace_orders o on o.id = p.order_id
  join public.marketplace_order_items i on i.order_id = o.id
  where o.id = p_order_id and o.buyer_email = p_buyer_email
    and o.total_minor = p_amount and i.price_minor = p_amount
    and i.seller_id = v_seller_id
    and p.attempt_number = 1 and p.provider = 'flow'
    and p.provider_account_ref = 'crececonia'
    and p.provider_payment_ref = p_token and p.amount_minor = p_amount
    and p.currency = 'CLP' and o.currency = 'CLP'
    and (select count(*) from public.marketplace_order_items x where x.order_id = o.id) = 1
  for update of p, o;
  if v_payment_id is null then return; end if;
  if v_payment_status in ('refunded', 'disputed')
     or v_order_status in ('refunded', 'disputed') then
    return query select v_payment_id, 'reversed'::text;
    return;
  end if;
  if v_payment_status not in ('pending', 'confirmed')
     or v_order_status not in ('pending', 'paid')
     or (v_existing_fee is not null and p_gateway_fee is not null
         and v_existing_fee <> p_gateway_fee) then
    return;
  end if;
  v_effective_fee := coalesce(v_existing_fee, p_gateway_fee);

  update public.marketplace_payments
    set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now()),
        gateway_fee_actual_minor = v_effective_fee
  where id = v_payment_id;
  insert into public.marketplace_payment_events
    (payment_id, provider, provider_event_ref, event_type,
     payload_digest, processing_status, processed_at)
  values (v_payment_id, 'flow', p_event_ref, 'payment_confirmed',
          p_payload_digest, 'processed', now())
  on conflict (provider, provider_event_ref) do nothing;
  update public.marketplace_orders
    set status = 'paid', paid_at = coalesce(paid_at, now())
  where id = p_order_id;
  insert into public.marketplace_entitlements
    (order_item_id, buyer_email, book_id, status)
  select i.id, o.buyer_email, i.book_id, 'active'
  from public.marketplace_order_items i
  join public.marketplace_orders o on o.id = i.order_id
  where i.id = v_item_id
  on conflict (order_item_id) do nothing;
  insert into public.marketplace_ledger_entries
    (journal_id, order_id, order_item_id, payment_id, account_code,
     debit_minor, credit_minor, source_type, source_ref)
  values
    (p_order_id, p_order_id, v_item_id, v_payment_id, 'processor_clearing',
      p_amount, 0, 'payment_confirmed', p_order_id::text),
    (p_order_id, p_order_id, v_item_id, v_payment_id, 'seller_payable',
      0, p_amount - v_commission, 'payment_confirmed', p_order_id::text)
  on conflict (journal_id, account_code, source_type, source_ref) do nothing;
  if v_commission > 0 then
    insert into public.marketplace_ledger_entries
      (journal_id, order_id, order_item_id, payment_id, account_code,
       debit_minor, credit_minor, source_type, source_ref)
    values (p_order_id, p_order_id, v_item_id, v_payment_id, 'platform_commission',
            0, v_commission, 'payment_confirmed', p_order_id::text)
    on conflict (journal_id, account_code, source_type, source_ref) do nothing;
  end if;
  if v_effective_fee is not null and v_effective_fee > 0 then
    insert into public.marketplace_ledger_entries
      (journal_id, order_id, order_item_id, payment_id, account_code,
       debit_minor, credit_minor, source_type, source_ref)
    values
      (v_payment_id, p_order_id, v_item_id, v_payment_id, 'seller_payable',
       v_effective_fee, 0, 'gateway_fee_actual', v_payment_id::text),
      (v_payment_id, p_order_id, v_item_id, v_payment_id, 'processor_clearing',
       0, v_effective_fee, 'gateway_fee_actual', v_payment_id::text)
    on conflict (journal_id, account_code, source_type, source_ref) do nothing;
  end if;
  insert into public.marketplace_outbox
    (event_type, aggregate_type, aggregate_id, idempotency_key, payload)
  values ('purchase_delivery', 'order', p_order_id,
          'marketplace-delivery/' || p_order_id::text, '{}'::jsonb)
  on conflict (idempotency_key) do nothing;
  return query select v_payment_id, 'paid'::text;
end;
$$;

revoke all on function public.marketplace_finalize_flow_payment(uuid, text, bigint, text, text, text, bigint) from public;

commit;
