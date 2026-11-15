begin;

create view public.marketplace_seller_payout_balances as
select s.id as seller_id, s.display_name,
  coalesce(l.ledger_net, 0)::bigint as ledger_net_minor,
  coalesce(p.paid_out, 0)::bigint as settled_minor,
  (coalesce(l.ledger_net, 0) - coalesce(p.paid_out, 0))::bigint as available_minor,
  coalesce(issues.blocked, false) as blocked
from public.marketplace_sellers s
left join lateral (
  select sum(le.credit_minor - le.debit_minor) as ledger_net
  from public.marketplace_ledger_entries le
  join public.marketplace_order_items i on i.id = le.order_item_id
  where i.seller_id = s.id and le.account_code = 'seller_payable'
) l on true
left join lateral (
  select sum(st.net_minor) as paid_out
  from public.marketplace_settlements st
  where st.seller_id = s.id and st.status in ('paid', 'reconciled')
) p on true
left join lateral (
  select exists (
    select 1 from public.marketplace_order_items i
    join public.marketplace_orders o on o.id = i.order_id
    where i.seller_id = s.id and (
      o.status in ('partially_refunded', 'disputed', 'review_required')
      or (o.status in ('paid', 'refunded', 'disputed') and (
        (select count(*) from public.marketplace_order_items other where other.order_id = o.id) <> 1
        or (o.status = 'paid' and not exists (
          select 1 from public.marketplace_fiscal_evidence fiscal
          where fiscal.order_id = o.id
        ))
        or not exists (
          select 1 from public.marketplace_payments pay
          where pay.order_id = o.id
            and pay.status = case o.status when 'paid' then 'confirmed' else o.status end
            and pay.gateway_fee_actual_minor is not null
            and (pay.gateway_fee_actual_minor = 0 or (exists (
              select 1 from public.marketplace_ledger_entries fee
              where fee.payment_id = pay.id and fee.order_item_id = i.id
                and fee.account_code = 'seller_payable'
                and fee.source_type = 'gateway_fee_actual'
                and fee.debit_minor = pay.gateway_fee_actual_minor
                and fee.credit_minor = 0
            ) and exists (
              select 1 from public.marketplace_ledger_entries fee
              where fee.payment_id = pay.id and fee.order_item_id = i.id
                and fee.account_code = 'processor_clearing'
                and fee.source_type = 'gateway_fee_actual'
                and fee.credit_minor = pay.gateway_fee_actual_minor
                and fee.debit_minor = 0
            )))
        )
      ))
      or exists (
        select 1 from public.marketplace_refunds refund
        join public.marketplace_payments pay on pay.id = refund.payment_id
        where pay.order_id = o.id and refund.status in ('requested', 'processing')
      )
    )
  ) as blocked
) issues on true;

create function public.marketplace_preserve_manual_settlement() returns trigger
language plpgsql as $$
begin
  if old.provider = 'manual_bank' then
    raise exception 'manual marketplace payout is immutable';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger marketplace_manual_settlements_immutable
before update or delete on public.marketplace_settlements
for each row execute function public.marketplace_preserve_manual_settlement();

create function public.marketplace_record_manual_settlement(
  p_seller_id uuid, p_amount_minor bigint, p_reference text, p_occurred_at timestamptz
) returns table(settlement_id uuid, inserted boolean)
language plpgsql as $$
declare
  v_existing public.marketplace_settlements%rowtype;
  v_balance record;
  v_id uuid;
begin
  if p_amount_minor is null or p_amount_minor <= 0 or p_reference is null
     or char_length(p_reference) < 3 or char_length(p_reference) > 120
     or p_reference ~ '[[:cntrl:]<>]' or p_occurred_at is null
     or p_occurred_at > now() + interval '1 minute' then
    raise exception 'marketplace settlement invalid input';
  end if;

  perform 1 from public.marketplace_sellers where id = p_seller_id for update;
  if not found then raise exception 'marketplace settlement seller missing'; end if;

  select * into v_existing from public.marketplace_settlements
  where provider = 'manual_bank' and provider_settlement_ref = p_reference;
  if found then
    if v_existing.seller_id = p_seller_id and v_existing.net_minor = p_amount_minor
       and v_existing.occurred_at = p_occurred_at and v_existing.status = 'paid' then
      return query select v_existing.id, false;
      return;
    end if;
    raise exception 'marketplace settlement reference conflict';
  end if;

  select * into v_balance from public.marketplace_seller_payout_balances
  where seller_id = p_seller_id;
  if v_balance.blocked or v_balance.available_minor <= 0
     or p_amount_minor > v_balance.available_minor then
    raise exception 'marketplace settlement balance unavailable';
  end if;

  insert into public.marketplace_settlements
    (seller_id, provider, provider_settlement_ref, gross_minor, fees_minor,
     net_minor, status, occurred_at)
  values (p_seller_id, 'manual_bank', p_reference, p_amount_minor, 0,
    p_amount_minor, 'paid', p_occurred_at)
  on conflict (provider, provider_settlement_ref) do nothing
  returning id into v_id;
  if v_id is null then raise exception 'marketplace settlement reference conflict'; end if;

  insert into public.marketplace_audit_log
    (actor_user_id, action, entity_type, entity_id, metadata)
  values ('admin', 'manual_seller_payout_recorded', 'marketplace_settlement', v_id,
    jsonb_build_object('seller_id', p_seller_id, 'amount_minor', p_amount_minor));
  return query select v_id, true;
end;
$$;

revoke all on function public.marketplace_record_manual_settlement(uuid, bigint, text, timestamptz) from public;
revoke all on function public.marketplace_preserve_manual_settlement() from public;

commit;
