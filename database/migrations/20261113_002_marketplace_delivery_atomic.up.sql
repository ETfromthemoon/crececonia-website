begin;

alter table public.marketplace_outbox add column claim_token uuid;
alter table public.marketplace_outbox add column delivery_token_expires_at timestamptz;

create function public.marketplace_confirm_sandbox_payment(
  p_order_id uuid, p_token text, p_flow_order bigint, p_amount bigint,
  p_buyer_email text, p_digest text
) returns text language plpgsql as $$
declare
  v_order public.marketplace_orders%rowtype;
  v_item public.marketplace_order_items%rowtype;
  v_payment public.marketplace_payments%rowtype;
begin
  select * into v_order from public.marketplace_orders where id=p_order_id for update;
  if not found or v_order.buyer_email<>p_buyer_email or v_order.total_minor<>p_amount
     or v_order.status not in ('pending','paid') then
    raise exception 'marketplace payment/order mismatch';
  end if;
  select * into strict v_item from public.marketplace_order_items where order_id=p_order_id;
  if v_item.price_minor<>p_amount or v_item.tax_minor<>0 or v_item.tax_mode not in ('exempt','not_applicable')
     or v_item.commission_minor>=p_amount then
    raise exception 'marketplace sandbox tax/price policy unresolved';
  end if;
  select * into v_payment from public.marketplace_payments
    where order_id=p_order_id and attempt_number=1 for update;
  if not found then
    -- Flow can complete before checkout receives its create response. The verified
    -- provider token from getStatus is sufficient to recover that missing row.
    insert into public.marketplace_payments
      (order_id,provider,provider_account_ref,provider_payment_ref,attempt_number,amount_minor,status,confirmed_at)
      values (p_order_id,'flow','crececonia',p_token,1,p_amount,'confirmed',now())
      on conflict (order_id,attempt_number) do nothing;
    select * into v_payment from public.marketplace_payments
      where order_id=p_order_id and attempt_number=1 for update;
  end if;
  if not found or v_payment.provider<>'flow' or v_payment.provider_payment_ref<>p_token
     or v_payment.amount_minor<>p_amount or v_payment.status not in ('pending','confirmed') then
    raise exception 'marketplace payment attempt mismatch';
  end if;
  update public.marketplace_payments set status='confirmed',confirmed_at=coalesce(confirmed_at,now())
    where id=v_payment.id;
  insert into public.marketplace_payment_events
    (payment_id,provider,provider_event_ref,event_type,payload_digest,processing_status,processed_at)
    values (v_payment.id,'flow',p_flow_order::text||':paid','payment_confirmed',p_digest,'processed',now())
    on conflict (provider,provider_event_ref) do nothing;
  if exists(select 1 from public.marketplace_payment_events
    where provider='flow' and provider_event_ref=p_flow_order::text||':paid'
      and (payment_id<>v_payment.id or payload_digest<>p_digest)) then
    raise exception 'marketplace provider event collision';
  end if;
  update public.marketplace_orders set status='paid',paid_at=coalesce(paid_at,now()) where id=p_order_id;
  insert into public.marketplace_entitlements (order_item_id,buyer_email,book_id,status)
    values (v_item.id,p_buyer_email,v_item.book_id,'active') on conflict (order_item_id) do nothing;
  if not exists(select 1 from public.marketplace_entitlements
    where order_item_id=v_item.id and buyer_email=p_buyer_email and book_id=v_item.book_id and status='active') then
    raise exception 'marketplace entitlement requires review';
  end if;
  insert into public.marketplace_ledger_entries
    (journal_id,order_id,order_item_id,payment_id,account_code,debit_minor,credit_minor,source_type,source_ref)
    values
    (p_order_id,p_order_id,v_item.id,v_payment.id,'processor_clearing',p_amount,0,'payment_confirmed',p_order_id::text),
    (p_order_id,p_order_id,v_item.id,v_payment.id,'seller_payable',0,p_amount-v_item.commission_minor,'payment_confirmed',p_order_id::text),
    (p_order_id,p_order_id,v_item.id,v_payment.id,'platform_commission',0,v_item.commission_minor,'payment_confirmed',p_order_id::text)
    on conflict (journal_id,account_code,source_type,source_ref) do nothing;
  if (select count(*) from public.marketplace_ledger_entries
      where journal_id=p_order_id and source_type='payment_confirmed')<>3
     or (select coalesce(sum(debit_minor-credit_minor),0) from public.marketplace_ledger_entries
      where journal_id=p_order_id and source_type='payment_confirmed')<>0
     or not exists(select 1 from public.marketplace_ledger_entries
      where journal_id=p_order_id and account_code='processor_clearing' and debit_minor=p_amount and credit_minor=0)
     or not exists(select 1 from public.marketplace_ledger_entries
      where journal_id=p_order_id and account_code='seller_payable' and credit_minor=p_amount-v_item.commission_minor and debit_minor=0)
     or not exists(select 1 from public.marketplace_ledger_entries
      where journal_id=p_order_id and account_code='platform_commission' and credit_minor=v_item.commission_minor and debit_minor=0) then
    raise exception 'marketplace journal requires review';
  end if;
  insert into public.marketplace_outbox (event_type,aggregate_type,aggregate_id,idempotency_key,payload)
    values ('purchase_delivery','order',p_order_id,'marketplace-delivery/'||p_order_id,'{}'::jsonb)
    on conflict (idempotency_key) do nothing;
  return 'recorded';
end;
$$;

revoke all on function public.marketplace_confirm_sandbox_payment(uuid,text,bigint,bigint,text,text) from public;

commit;
