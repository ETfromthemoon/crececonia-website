-- E05-B1 dormant contract. Requires 003. No consumer or scheduled worker is enabled.
create table commerce.ebook_payment_finalizations (
  flow_order bigint primary key check (flow_order > 0),
  commerce_order text not null unique,
  buyer_email text not null,
  paid_amount integer not null check (paid_amount > 0),
  manifest jsonb not null,
  grants jsonb not null,
  job_id uuid not null references commerce.ebook_delivery_jobs(id),
  created_at timestamptz not null default now()
);
create table commerce.ebook_payment_effects (
  flow_order bigint not null references commerce.ebook_payment_finalizations(flow_order) deferrable initially deferred,
  kind text not null check (kind in ('cupo', 'discount', 'delivery')),
  resource text not null,
  status text not null check (status in ('applied', 'not_applicable', 'needs_review')),
  reason text not null check (reason in ('applied', 'regular_tier', 'no_discount', 'cupo_unavailable', 'discount_unavailable', 'historical_accounting_unknown', 'historical_delivery_unknown', 'recovery_delivery_requires_review')),
  primary key (flow_order, kind, resource)
);

-- One statement gives callers a consistent snapshot. Tokens and payloads are private.
create function commerce.read_ebook_finalization(p_flow_order bigint, p_commerce_order text)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'receipt', (select to_jsonb(r) from commerce.ebook_payment_finalizations r where r.flow_order = p_flow_order),
    'manifest', (select jsonb_build_object('resources', p.resources, 'discount_code', p.discount_code)
      from commerce.ebook_pending_orders p where p.commerce_order = p_commerce_order),
    'purchases', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'email', b.email,
      'resource', b.resource, 'amount', b.amount, 'tier', b.tier, 'token', b.flow_token) order by b.resource, b.id)
      from commerce.ebook_purchases b where b.flow_order = p_flow_order), '[]'::jsonb));
$$;

-- All callers (webhook AND recovery) must use this protocol before activation.
-- Receipt replay precedes snapshot/payload comparison: a copy deployment cannot
-- replace a provider identity or break acknowledgment of an already finalized order.
create function commerce.finalize_ebook_payment(
  p_flow_order bigint, p_commerce_order text, p_email text, p_paid_amount integer,
  p_token text, p_snapshot jsonb, p_payload jsonb, p_source text default 'webhook'
) returns jsonb language plpgsql set search_path = '' as $$
declare
  receipt commerce.ebook_payment_finalizations%rowtype;
  current_snapshot jsonb;
  manifest jsonb;
  item jsonb;
  prior jsonb;
  grants jsonb := '[]'::jsonb;
  grant_token text;
  delivery_id uuid;
  has_history boolean;
  affected integer;
  discount text;
begin
  if p_flow_order is null or p_flow_order <= 0 or p_commerce_order is null
    or length(p_commerce_order) not between 1 and 200 or p_email is null
    or length(p_email) not between 3 and 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_paid_amount is null or p_paid_amount <= 0 or p_token is null
    or length(p_token) not between 1 and 512 or p_source not in ('webhook', 'recovery') or p_source is null then
    raise exception 'invalid_ebook_payment';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(p_flow_order);
  select * into receipt from commerce.ebook_payment_finalizations r where r.flow_order = p_flow_order;
  if found then
    if receipt.commerce_order <> p_commerce_order or receipt.buyer_email <> p_email or receipt.paid_amount <> p_paid_amount then
      raise exception 'ebook_payment_identity_conflict';
    end if;
    return jsonb_build_object('outcome', 'existing', 'job_id', receipt.job_id);
  end if;
  -- Serialize two Flow orders pointing at one manifest as well as same-order callers.
  perform 1 from commerce.ebook_pending_orders p where p.commerce_order = p_commerce_order for update;
  current_snapshot := commerce.read_ebook_finalization(p_flow_order, p_commerce_order);
  if p_snapshot is distinct from current_snapshot then
    return jsonb_build_object('outcome', 'snapshot_changed');
  end if;
  manifest := current_snapshot->'manifest';
  if manifest is null or manifest = 'null'::jsonb or jsonb_typeof(manifest->'resources') is distinct from 'array' then
    raise exception 'ebook_payment_manifest_missing';
  end if;
  if jsonb_array_length(manifest->'resources') not between 1 and 50 then
    raise exception 'ebook_payment_manifest_invalid';
  end if;
  for item in select value from jsonb_array_elements(manifest->'resources') loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item->'resource') is distinct from 'string'
      or length(item->>'resource') not between 1 and 200
      or item->>'tier' not in ('super-early', 'early', 'regular') or item->>'tier' is null
      or jsonb_typeof(item->'amount') is distinct from 'number'
      or (item->>'amount')::numeric not between 1 and 2147483647
      or trunc((item->>'amount')::numeric) <> (item->>'amount')::numeric then
      raise exception 'ebook_payment_manifest_invalid';
    end if;
  end loop;
  if (select count(distinct value->>'resource') from jsonb_array_elements(manifest->'resources')) <> jsonb_array_length(manifest->'resources')
    or (select sum((value->>'amount')::numeric) from jsonb_array_elements(manifest->'resources')) <> p_paid_amount then
    raise exception 'ebook_payment_manifest_invalid';
  end if;
  has_history := jsonb_array_length(current_snapshot->'purchases') > 0;
  -- Existing entitlements are authoritative. Do not fabricate tokens or silently
  -- accept an extra grant, duplicate resource, different payer, tier or amount.
  for prior in select value from jsonb_array_elements(current_snapshot->'purchases') loop
    if prior->>'email' <> p_email or coalesce(prior->>'token', '') = ''
      or (select count(*) from jsonb_array_elements(current_snapshot->'purchases') x where x->>'resource' = prior->>'resource') <> 1
      or not exists (select 1 from jsonb_array_elements(manifest->'resources') x
        where x->>'resource' = prior->>'resource' and x->>'tier' = prior->>'tier' and x->'amount' = prior->'amount') then
      raise exception 'ebook_payment_grant_conflict';
    end if;
  end loop;
  discount := nullif(upper(btrim(manifest->>'discount_code')), '');
  for item in select value from jsonb_array_elements(manifest->'resources') loop
    select value into prior from jsonb_array_elements(current_snapshot->'purchases') where value->>'resource' = item->>'resource';
    if prior is not null then
      grant_token := prior->>'token';
      insert into commerce.ebook_payment_effects values (p_flow_order, 'cupo', item->>'resource', 'needs_review', 'historical_accounting_unknown');
    else
      grant_token := p_token;
      insert into commerce.ebook_purchases (email, resource, amount, tier, flow_order, flow_token, discount_code)
        values (p_email, item->>'resource', (item->>'amount')::integer, item->>'tier', p_flow_order, grant_token,
          case when jsonb_array_length(manifest->'resources') = 1 then discount else null end);
      if item->>'tier' = 'regular' then
        insert into commerce.ebook_payment_effects values (p_flow_order, 'cupo', item->>'resource', 'not_applicable', 'regular_tier');
      else
        update commerce.ebook_cupos set used = used + 1
          where resource = item->>'resource' and tier = item->>'tier' and used < total;
        get diagnostics affected = row_count;
        insert into commerce.ebook_payment_effects values (p_flow_order, 'cupo', item->>'resource',
          case when affected = 1 then 'applied' else 'needs_review' end,
          case when affected = 1 then 'applied' else 'cupo_unavailable' end);
      end if;
    end if;
    grants := grants || jsonb_build_array(jsonb_build_object('resource', item->>'resource', 'token', grant_token));
  end loop;
  if has_history then
    insert into commerce.ebook_payment_effects values (p_flow_order, 'discount', '', 'needs_review', 'historical_accounting_unknown');
  elsif discount is null then
    insert into commerce.ebook_payment_effects values (p_flow_order, 'discount', '', 'not_applicable', 'no_discount');
  elsif jsonb_array_length(manifest->'resources') <> 1 then
    insert into commerce.ebook_payment_effects values (p_flow_order, 'discount', '', 'needs_review', 'discount_unavailable');
  else
    update commerce.discount_codes set used_count = used_count + 1 where code = discount and active
      and (expires_at is null or expires_at >= now()) and (max_uses is null or used_count < max_uses);
    get diagnostics affected = row_count;
    insert into commerce.ebook_payment_effects values (p_flow_order, 'discount', '',
      case when affected = 1 then 'applied' else 'needs_review' end,
      case when affected = 1 then 'applied' else 'discount_unavailable' end);
  end if;
  if p_payload->>'to' is distinct from p_email then raise exception 'ebook_delivery_recipient_conflict'; end if;
  -- A pre-existing job without our receipt is ambiguous; never adopt/resend it.
  if exists (select 1 from commerce.ebook_delivery_jobs where flow_order = p_flow_order) then
    raise exception 'ebook_delivery_without_receipt';
  end if;
  select job_id into delivery_id from commerce.enqueue_ebook_delivery(p_flow_order, p_commerce_order, p_payload);
  if has_history or p_source = 'recovery' then
    update commerce.ebook_delivery_jobs set status = 'needs_review' where id = delivery_id;
    insert into commerce.ebook_payment_effects values (p_flow_order, 'delivery', '', 'needs_review',
      case when has_history then 'historical_delivery_unknown' else 'recovery_delivery_requires_review' end);
  end if;
  insert into commerce.ebook_payment_finalizations(flow_order, commerce_order, buyer_email, paid_amount, manifest, grants, job_id)
    values (p_flow_order, p_commerce_order, p_email, p_paid_amount, manifest, grants, delivery_id);
  delete from commerce.ebook_pending_orders where commerce_order = p_commerce_order;
  return jsonb_build_object('outcome', 'finalized', 'job_id', delivery_id);
end;
$$;
revoke all on commerce.ebook_payment_finalizations, commerce.ebook_payment_effects from public, anon, authenticated;
revoke all on function commerce.read_ebook_finalization(bigint, text) from public, anon, authenticated;
revoke all on function commerce.finalize_ebook_payment(bigint, text, text, integer, text, jsonb, jsonb, text) from public, anon, authenticated;
