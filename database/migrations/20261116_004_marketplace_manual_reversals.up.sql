begin;

-- Records a full refund or chargeback already confirmed outside this app.
-- Locking the seller first serializes this decision with manual payouts.
create function public.marketplace_record_external_reversal(
  p_payment_id uuid, p_provider_ref text, p_kind text, p_evidence_note text
) returns table(reversal_id uuid, recorded boolean)
language plpgsql as $$
declare
  v_seller_id uuid;
  v_order_id uuid;
  v_item_id uuid;
  v_total bigint;
  v_commission bigint;
  v_order_status text;
  v_payment_status text;
  v_account_ref text;
  v_existing public.marketplace_refunds%rowtype;
  v_reversal_id uuid;
begin
  if p_kind is null or p_kind not in ('refund', 'chargeback')
     or p_provider_ref is null or p_evidence_note is null
     or char_length(p_provider_ref) not between 3 and 120
     or p_provider_ref ~ '[\r\n\t<>]'
     or char_length(btrim(p_evidence_note)) not between 20 and 2000 then
    return;
  end if;

  select i.seller_id into v_seller_id
  from public.marketplace_payments p
  join public.marketplace_order_items i on i.order_id = p.order_id
  where p.id = p_payment_id;
  if v_seller_id is null then return; end if;
  perform 1 from public.marketplace_sellers where id = v_seller_id for update;

  select p.order_id, i.id, p.amount_minor, i.commission_minor,
         o.status, p.status, p.provider_account_ref
    into v_order_id, v_item_id, v_total, v_commission,
         v_order_status, v_payment_status, v_account_ref
  from public.marketplace_payments p
  join public.marketplace_orders o on o.id = p.order_id
  join public.marketplace_order_items i on i.order_id = o.id
  where p.id = p_payment_id and p.provider = 'flow'
    and p.currency = 'CLP' and o.currency = 'CLP'
    and p.amount_minor = o.total_minor and i.price_minor = o.total_minor
    and i.seller_id = v_seller_id
    and (select count(*) from public.marketplace_order_items x where x.order_id = o.id) = 1
  for update of p, o;
  if v_order_id is null or v_account_ref <> 'crececonia' then return; end if;

  select * into v_existing from public.marketplace_refunds
  where provider_refund_ref = p_provider_ref;
  if found then
    if v_existing.payment_id = p_payment_id and v_existing.amount_minor = v_total
       and v_existing.reason_code = p_kind and v_existing.status = 'succeeded' then
      return query select v_existing.id, false;
    end if;
    return;
  end if;
  if v_order_status <> 'paid' or v_payment_status <> 'confirmed'
     or exists (select 1 from public.marketplace_refunds
                where payment_id = p_payment_id and status = 'succeeded') then
    return;
  end if;
  -- Never reverse a sale whose original journal is incomplete.
  if not exists (select 1 from public.marketplace_ledger_entries l
                 where l.order_id = v_order_id and l.payment_id = p_payment_id
                   and l.source_type = 'payment_confirmed'
                   and l.account_code = 'processor_clearing'
                   and l.debit_minor = v_total)
     or not exists (select 1 from public.marketplace_ledger_entries l
                    where l.order_id = v_order_id and l.payment_id = p_payment_id
                      and l.source_type = 'payment_confirmed'
                      and l.account_code = 'seller_payable'
                      and l.credit_minor = v_total - v_commission)
     or (v_commission > 0 and not exists (
           select 1 from public.marketplace_ledger_entries l
           where l.order_id = v_order_id and l.payment_id = p_payment_id
             and l.source_type = 'payment_confirmed'
             and l.account_code = 'platform_commission'
             and l.credit_minor = v_commission)) then
    return;
  end if;

  insert into public.marketplace_refunds
    (payment_id, provider_refund_ref, amount_minor, reason_code, status, requested_by, completed_at)
  values (p_payment_id, p_provider_ref, v_total, p_kind, 'succeeded', 'admin', now())
  returning id into v_reversal_id;

  insert into public.marketplace_ledger_entries
    (journal_id, order_id, order_item_id, payment_id, account_code,
     debit_minor, credit_minor, source_type, source_ref)
  values
    (v_reversal_id, v_order_id, v_item_id, p_payment_id, 'seller_payable',
      v_total - v_commission, 0, 'external_reversal', p_provider_ref),
    (v_reversal_id, v_order_id, v_item_id, p_payment_id, 'processor_clearing',
      0, v_total, 'external_reversal', p_provider_ref);
  if v_commission > 0 then
    insert into public.marketplace_ledger_entries
      (journal_id, order_id, order_item_id, payment_id, account_code,
       debit_minor, credit_minor, source_type, source_ref)
    values (v_reversal_id, v_order_id, v_item_id, p_payment_id, 'platform_commission',
            v_commission, 0, 'external_reversal', p_provider_ref);
  end if;

  update public.marketplace_payments
    set status = case when p_kind = 'chargeback' then 'disputed' else 'refunded' end
  where id = p_payment_id;
  update public.marketplace_orders
    set status = case when p_kind = 'chargeback' then 'disputed' else 'refunded' end
  where id = v_order_id;
  update public.marketplace_entitlements
    set status = 'revoked', revoked_at = now()
  where order_item_id = v_item_id and status = 'active';
  update public.marketplace_outbox
    set status = 'dead_letter', lease_until = null,
        last_error_code = 'order_reversed'
  where aggregate_type = 'order' and aggregate_id = v_order_id
    and event_type = 'purchase_delivery' and status in ('pending', 'failed');
  insert into public.marketplace_audit_log
    (actor_user_id, action, entity_type, entity_id, reason, metadata)
  values ('admin', 'external_reversal_recorded', 'marketplace_order', v_order_id,
          p_evidence_note,
          jsonb_build_object('reversal_id', v_reversal_id, 'kind', p_kind,
                             'provider_reference', p_provider_ref));
  return query select v_reversal_id, true;
end;
$$;

revoke all on function public.marketplace_record_external_reversal(uuid, text, text, text) from public;

create function public.marketplace_preserve_completed_refund() returns trigger
language plpgsql as $$
begin
  if old.status = 'succeeded' then
    raise exception 'completed marketplace refund evidence is immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger marketplace_completed_refund_immutable
before update or delete on public.marketplace_refunds
for each row execute function public.marketplace_preserve_completed_refund();
revoke all on function public.marketplace_preserve_completed_refund() from public;

commit;
