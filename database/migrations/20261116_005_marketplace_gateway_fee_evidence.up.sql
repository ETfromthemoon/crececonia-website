begin;

create table public.marketplace_gateway_fee_evidence (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null unique references public.marketplace_payments(id) on delete restrict,
  amount_minor bigint not null check (amount_minor >= 0),
  statement_reference text not null check (char_length(statement_reference) between 3 and 120),
  evidence_note text not null check (char_length(btrim(evidence_note)) between 20 and 2000),
  recorded_by text not null default 'admin',
  recorded_at timestamptz not null default now()
);

create trigger marketplace_gateway_fee_evidence_immutable
before update or delete on public.marketplace_gateway_fee_evidence
for each row execute function public.marketplace_reject_immutable_mutation();

create function public.marketplace_record_gateway_fee(
  p_payment_id uuid, p_amount bigint, p_statement_ref text, p_note text
) returns table(evidence_id uuid, recorded boolean)
language plpgsql as $$
declare
  v_seller_id uuid;
  v_order_id uuid;
  v_item_id uuid;
  v_total bigint;
  v_existing_fee bigint;
  v_existing public.marketplace_gateway_fee_evidence%rowtype;
  v_evidence_id uuid;
begin
  if p_amount is null or p_amount < 0
     or p_statement_ref is null or p_note is null
     or char_length(p_statement_ref) not between 3 and 120
     or p_statement_ref ~ '[\r\n\t<>]'
     or char_length(btrim(p_note)) not between 20 and 2000 then
    return;
  end if;
  select i.seller_id into v_seller_id
  from public.marketplace_payments p
  join public.marketplace_order_items i on i.order_id = p.order_id
  where p.id = p_payment_id;
  if v_seller_id is null then return; end if;
  perform 1 from public.marketplace_sellers where id = v_seller_id for update;

  select p.order_id, i.id, p.amount_minor, p.gateway_fee_actual_minor
    into v_order_id, v_item_id, v_total, v_existing_fee
  from public.marketplace_payments p
  join public.marketplace_orders o on o.id = p.order_id
  join public.marketplace_order_items i on i.order_id = o.id
  where p.id = p_payment_id and p.provider = 'flow'
    and p.provider_account_ref = 'crececonia'
    and p.status in ('confirmed', 'refunded', 'disputed')
    and o.status in ('paid', 'refunded', 'disputed')
    and p.currency = 'CLP' and o.currency = 'CLP'
    and p.amount_minor = o.total_minor and i.price_minor = o.total_minor
    and i.seller_id = v_seller_id
    and (select count(*) from public.marketplace_order_items x where x.order_id = o.id) = 1
  for update of p, o;
  if v_order_id is null or p_amount > v_total
     or (v_existing_fee is not null and v_existing_fee <> p_amount) then
    return;
  end if;
  if exists (
    select 1 from public.marketplace_ledger_entries l
    where l.payment_id = p_payment_id and l.source_type = 'gateway_fee_actual'
      and (p_amount = 0
        or (l.account_code = 'seller_payable' and
            (l.debit_minor <> p_amount or l.credit_minor <> 0))
        or (l.account_code = 'processor_clearing' and
            (l.credit_minor <> p_amount or l.debit_minor <> 0))
        or l.account_code not in ('seller_payable', 'processor_clearing'))
  ) then return; end if;

  select * into v_existing from public.marketplace_gateway_fee_evidence
  where payment_id = p_payment_id;
  if found then
    if v_existing.payment_id = p_payment_id and v_existing.amount_minor = p_amount
       and v_existing.statement_reference = p_statement_ref
       and v_existing.evidence_note = p_note then
      return query select v_existing.id, false;
    end if;
    return;
  end if;

  insert into public.marketplace_gateway_fee_evidence
    (payment_id, amount_minor, statement_reference, evidence_note)
  values (p_payment_id, p_amount, p_statement_ref, p_note)
  returning id into v_evidence_id;
  update public.marketplace_payments
    set gateway_fee_actual_minor = p_amount
  where id = p_payment_id and gateway_fee_actual_minor is null;
  if p_amount > 0 then
    insert into public.marketplace_ledger_entries
      (journal_id, order_id, order_item_id, payment_id, account_code,
       debit_minor, credit_minor, source_type, source_ref)
    values
      (p_payment_id, v_order_id, v_item_id, p_payment_id, 'seller_payable',
       p_amount, 0, 'gateway_fee_actual', p_payment_id::text),
      (p_payment_id, v_order_id, v_item_id, p_payment_id, 'processor_clearing',
       0, p_amount, 'gateway_fee_actual', p_payment_id::text)
    on conflict (journal_id, account_code, source_type, source_ref) do nothing;
    if (select count(*) from public.marketplace_ledger_entries l
        where l.payment_id = p_payment_id and l.source_type = 'gateway_fee_actual'
          and ((l.account_code = 'seller_payable' and l.debit_minor = p_amount)
            or (l.account_code = 'processor_clearing' and l.credit_minor = p_amount))) <> 2 then
      raise exception 'marketplace gateway fee ledger mismatch';
    end if;
  end if;
  insert into public.marketplace_audit_log
    (actor_user_id, action, entity_type, entity_id, metadata)
  values ('admin', 'gateway_fee_evidence_recorded', 'marketplace_payment', p_payment_id,
          jsonb_build_object('evidence_id', v_evidence_id,
                             'amount_minor', p_amount,
                             'statement_reference', p_statement_ref));
  return query select v_evidence_id, true;
end;
$$;

revoke all on function public.marketplace_record_gateway_fee(uuid, bigint, text, text) from public;

commit;
