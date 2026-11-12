begin;

-- E10 stage A: durable reservations for a future launch checkout.
-- This migration alone does not create a route, Flow order, worker, or schedule.
create table commerce.launch_checkout_orders (
  commerce_order text primary key check (commerce_order ~ '^launch-[a-zA-Z0-9-]{1,190}$'),
  idempotency_key_hash bytea not null unique check (octet_length(idempotency_key_hash) = 32),
  launch_id uuid not null references public.launches(id) on delete restrict,
  launch_slug_snapshot text not null,
  launch_name_snapshot text not null,
  launch_type_snapshot text not null check (launch_type_snapshot = 'ebook_release'),
  tier_id uuid not null references public.launch_price_tiers(id) on delete restrict,
  tier_label_snapshot text not null,
  resource text not null check (resource ~ '^ebook:[a-z0-9-]{1,160}$'),
  product_title_snapshot text not null,
  buyer_email text not null check (length(buyer_email) between 3 and 254 and buyer_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  amount_minor integer not null check (amount_minor > 0),
  flow_order bigint unique check (flow_order is null or flow_order > 0),
  capacity_held boolean not null default true,
  capacity_exception boolean not null default false,
  last_verified_flow_status integer check (last_verified_flow_status is null or last_verified_flow_status in (1, 2, 3, 4)),
  last_verified_flow_at timestamptz,
  observed_payment_payer text,
  observed_payment_amount integer check (observed_payment_amount is null or observed_payment_amount > 0),
  payment_observed_at timestamptz,
  status text not null default 'creating' check (status in (
    'creating', 'creation_submitted', 'creation_unknown', 'pending', 'payment_confirmed', 'finalized',
    'creation_failed', 'rejected', 'cancelled', 'needs_review'
  )),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status in ('pending', 'payment_confirmed', 'finalized', 'rejected', 'cancelled') and flow_order is not null)
      or (status in ('creating', 'creation_submitted', 'creation_unknown', 'creation_failed', 'needs_review'))),
  check ((status in ('creating', 'creation_submitted', 'creation_unknown', 'pending', 'payment_confirmed') and capacity_held)
      or (status in ('creation_failed', 'rejected', 'cancelled', 'finalized') and not capacity_held)
      or status = 'needs_review'),
  check (not capacity_exception or (status = 'needs_review' and not capacity_held))
);
create index launch_checkout_orders_pending_idx
  on commerce.launch_checkout_orders (expires_at, created_at)
  where status in ('creating', 'creation_submitted', 'creation_unknown', 'pending', 'payment_confirmed', 'needs_review');
create index launch_checkout_orders_launch_idx
  on commerce.launch_checkout_orders (launch_id, created_at desc);
create index launch_checkout_orders_tier_idx
  on commerce.launch_checkout_orders (tier_id, status);
create index launch_checkout_orders_capacity_exception_idx
  on commerce.launch_checkout_orders (tier_id) where capacity_exception;

create function commerce.preserve_launch_checkout_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.commerce_order is distinct from old.commerce_order
     or new.idempotency_key_hash is distinct from old.idempotency_key_hash
     or new.launch_id is distinct from old.launch_id
     or new.launch_slug_snapshot is distinct from old.launch_slug_snapshot
     or new.launch_name_snapshot is distinct from old.launch_name_snapshot
     or new.launch_type_snapshot is distinct from old.launch_type_snapshot
     or new.tier_id is distinct from old.tier_id
     or new.tier_label_snapshot is distinct from old.tier_label_snapshot
     or new.resource is distinct from old.resource
     or new.product_title_snapshot is distinct from old.product_title_snapshot
     or new.buyer_email is distinct from old.buyer_email
     or new.amount_minor is distinct from old.amount_minor
     or (old.flow_order is not null and new.flow_order is distinct from old.flow_order)
     or new.expires_at is distinct from old.expires_at
     or new.created_at is distinct from old.created_at then
    raise exception 'launch_checkout_identity_immutable';
  end if;
  return new;
end;
$$;
create trigger launch_checkout_identity_immutable
  before update on commerce.launch_checkout_orders
  for each row execute function commerce.preserve_launch_checkout_identity();

-- One ebook only in v1. An idempotency key is persisted only as a SHA-256 hash.
-- The caller supplies a server-generated commerce order; no client amount or product is accepted.
create function commerce.reserve_launch_checkout(
  p_commerce_order text,
  p_idempotency_key_hash bytea,
  p_launch_slug text,
  p_buyer_email text
) returns jsonb language plpgsql set search_path = '' as $$
declare
  existing commerce.launch_checkout_orders%rowtype;
  launch_row public.launches%rowtype;
  tier_row public.launch_price_tiers%rowtype;
  product_count integer;
  capacity_exceptions integer;
  product_row record;
  order_row commerce.launch_checkout_orders%rowtype;
begin
  if p_commerce_order is null or p_commerce_order !~ '^launch-[a-zA-Z0-9-]{1,190}$'
     or p_idempotency_key_hash is null or octet_length(p_idempotency_key_hash) <> 32
     or p_launch_slug is null or length(p_launch_slug) not between 1 and 140
     or p_buyer_email is null or length(p_buyer_email) not between 3 and 254
     or p_buyer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_launch_checkout_request';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(pg_catalog.encode(p_idempotency_key_hash, 'hex'), 0));
  select * into existing from commerce.launch_checkout_orders o
    where o.idempotency_key_hash = p_idempotency_key_hash for update;
  if found then
    if existing.buyer_email <> lower(p_buyer_email) or existing.launch_slug_snapshot <> p_launch_slug then
      raise exception 'launch_checkout_idempotency_conflict';
    end if;
    return pg_catalog.to_jsonb(existing) - 'idempotency_key_hash';
  end if;

  select * into launch_row from public.launches l
    where l.slug = p_launch_slug and l.status = 'published' and l.launch_type = 'ebook_release'
      and (l.starts_at is null or l.starts_at <= pg_catalog.clock_timestamp())
      and (l.ends_at is null or l.ends_at > pg_catalog.clock_timestamp())
    for update;
  if not found then raise exception 'launch_checkout_unavailable'; end if;

  select count(*)::integer into product_count from public.launch_products p where p.launch_id = launch_row.id;
  if product_count <> 1 then raise exception 'launch_checkout_requires_one_product'; end if;
  select p.resource, p.title_snapshot into product_row from public.launch_products p
    where p.launch_id = launch_row.id and p.role = 'primary' order by p.sort_order limit 1;
  if not found then raise exception 'launch_checkout_primary_product_invalid'; end if;
  if product_row.resource is null or product_row.resource !~ '^ebook:[a-z0-9-]{1,160}$' then
    raise exception 'launch_checkout_primary_product_invalid';
  end if;

  select * into tier_row from public.launch_price_tiers t
    where t.launch_id = launch_row.id and t.status = 'active'
    for update;
  if not found or tier_row.amount_minor <= 0 then raise exception 'launch_checkout_tier_unavailable'; end if;
  select count(*)::integer into capacity_exceptions from commerce.launch_checkout_orders o
    where o.tier_id = tier_row.id and o.status = 'needs_review' and o.capacity_exception;
  if tier_row.sold_count + tier_row.reserved_count + capacity_exceptions >= tier_row.capacity then
    raise exception 'launch_checkout_sold_out';
  end if;

  update public.launch_price_tiers t set reserved_count = t.reserved_count + 1, updated_at = pg_catalog.clock_timestamp()
    where t.id = tier_row.id and t.sold_count + t.reserved_count + capacity_exceptions < t.capacity;
  if not found then raise exception 'launch_checkout_sold_out'; end if;

  insert into commerce.launch_checkout_orders (
    commerce_order, idempotency_key_hash, launch_id, launch_slug_snapshot, launch_name_snapshot,
    launch_type_snapshot, tier_id, tier_label_snapshot, resource, product_title_snapshot,
    buyer_email, amount_minor, status, expires_at
  ) values (
    p_commerce_order, p_idempotency_key_hash, launch_row.id, launch_row.slug, launch_row.name,
    launch_row.launch_type, tier_row.id, tier_row.label, product_row.resource, product_row.title_snapshot,
    pg_catalog.lower(p_buyer_email), tier_row.amount_minor, 'creating',
    pg_catalog.clock_timestamp() + interval '20 minutes'
  ) returning * into order_row;

  insert into commerce.ebook_pending_orders (commerce_order, resources, discount_code)
  values (order_row.commerce_order,
    pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'resource', order_row.resource, 'tier', 'regular', 'amount', order_row.amount_minor
    )), null);

  return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
end;
$$;

create function commerce.attach_launch_flow_order(p_commerce_order text, p_flow_order bigint)
returns jsonb language plpgsql set search_path = '' as $$
declare
  order_row commerce.launch_checkout_orders%rowtype;
begin
  if p_commerce_order is null or p_flow_order is null or p_flow_order <= 0 then
    raise exception 'invalid_launch_flow_order';
  end if;
  select * into order_row from commerce.launch_checkout_orders o
    where o.commerce_order = p_commerce_order for update;
  if not found then raise exception 'launch_checkout_not_found'; end if;
  if order_row.flow_order is not null and order_row.flow_order <> p_flow_order then
    raise exception 'launch_flow_order_conflict';
  end if;
  if order_row.flow_order = p_flow_order then
    return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
  end if;
  if order_row.status not in ('creation_submitted', 'creation_unknown') then
    raise exception 'launch_checkout_not_attachable';
  end if;
  update commerce.launch_checkout_orders set flow_order = p_flow_order, status = 'pending', updated_at = pg_catalog.clock_timestamp()
    where commerce_order = p_commerce_order returning * into order_row;
  return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
end;
$$;

-- Persist that a provider request may be sent before the network call. A retry must not
-- submit a second Flow order when the first request's outcome is unknown.
create function commerce.mark_launch_checkout_creation_submitted(p_commerce_order text)
returns boolean language plpgsql set search_path = '' as $$
begin
  update commerce.launch_checkout_orders set status = 'creation_submitted', updated_at = pg_catalog.clock_timestamp()
    where commerce_order = p_commerce_order and status = 'creating' and flow_order is null;
  return found;
end;
$$;

-- Use only when Flow's create request was definitively rejected. Network timeouts are ambiguous
-- and must call mark_launch_checkout_creation_unknown instead, retaining the reserved capacity.
create function commerce.fail_launch_checkout_creation(p_commerce_order text)
returns boolean language plpgsql set search_path = '' as $$
declare
  order_row commerce.launch_checkout_orders%rowtype;
  affected integer;
begin
  select * into order_row from commerce.launch_checkout_orders o
    where o.commerce_order = p_commerce_order for update;
  if not found then return false; end if;
  if order_row.status = 'creation_failed' then return true; end if;
  if order_row.status not in ('creating', 'creation_submitted') or order_row.flow_order is not null then return false; end if;
  if order_row.capacity_held then
    update public.launch_price_tiers set reserved_count = reserved_count - 1, updated_at = pg_catalog.clock_timestamp()
      where id = order_row.tier_id and reserved_count > 0;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'launch_checkout_reservation_missing'; end if;
  end if;
  delete from commerce.ebook_pending_orders where commerce_order = p_commerce_order;
  update commerce.launch_checkout_orders set status = 'creation_failed', capacity_held = false, updated_at = pg_catalog.clock_timestamp()
    where commerce_order = p_commerce_order;
  return true;
end;
$$;

create function commerce.mark_launch_checkout_creation_unknown(p_commerce_order text)
returns boolean language plpgsql set search_path = '' as $$
begin
  update commerce.launch_checkout_orders set status = 'creation_unknown', updated_at = pg_catalog.clock_timestamp()
    where commerce_order = p_commerce_order and status in ('creating', 'creation_submitted') and flow_order is null;
  return found;
end;
$$;

-- The server calls this only with a status freshly verified through Flow's getStatus API.
-- A paid mismatch is quarantined and keeps its slot; only provider-terminal unpaid statuses release it.
create function commerce.record_launch_flow_status(
  p_commerce_order text, p_flow_order bigint, p_status integer, p_payer text, p_amount integer
) returns jsonb language plpgsql set search_path = '' as $$
declare
  order_row commerce.launch_checkout_orders%rowtype;
  tier_row public.launch_price_tiers%rowtype;
  capacity_exceptions integer;
  terminal_status text;
  affected integer;
begin
  if p_commerce_order is null or p_flow_order is null or p_flow_order <= 0
     or p_status is null or p_status not in (1, 2, 3, 4) then raise exception 'invalid_launch_flow_status'; end if;
  select * into order_row from commerce.launch_checkout_orders o
    where o.commerce_order = p_commerce_order for update;
  if not found then raise exception 'launch_checkout_not_found'; end if;
  if order_row.flow_order is null and order_row.status in ('creation_submitted', 'creation_unknown') then
    update commerce.launch_checkout_orders set flow_order = p_flow_order, status = 'pending', updated_at = pg_catalog.clock_timestamp()
      where commerce_order = p_commerce_order returning * into order_row;
  elsif order_row.flow_order is distinct from p_flow_order then
    raise exception 'launch_flow_order_conflict';
  end if;

  update commerce.launch_checkout_orders set last_verified_flow_status = p_status,
    last_verified_flow_at = pg_catalog.clock_timestamp(),
    observed_payment_payer = case when p_status = 2 then p_payer else observed_payment_payer end,
    observed_payment_amount = case when p_status = 2 then p_amount else observed_payment_amount end,
    payment_observed_at = case when p_status = 2 then pg_catalog.clock_timestamp() else payment_observed_at end
    where commerce_order = p_commerce_order returning * into order_row;

  if p_status = 1 then
    if order_row.status not in ('pending', 'payment_confirmed', 'finalized', 'needs_review') then
      raise exception 'launch_checkout_status_conflict';
    end if;
    return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
  elsif p_status = 2 then
    if p_payer is null or p_amount is null or p_amount <= 0 then raise exception 'invalid_launch_paid_response'; end if;
    if order_row.status in ('rejected', 'cancelled', 'creation_failed') then
      if not order_row.capacity_held then
        select * into tier_row from public.launch_price_tiers t where t.id = order_row.tier_id for update;
        if not found then raise exception 'launch_checkout_tier_missing'; end if;
        select count(*)::integer into capacity_exceptions from commerce.launch_checkout_orders o
          where o.tier_id = order_row.tier_id and o.commerce_order <> p_commerce_order
            and o.status = 'needs_review' and o.capacity_exception;
        update public.launch_price_tiers set reserved_count = reserved_count + 1, updated_at = pg_catalog.clock_timestamp()
          where id = order_row.tier_id and sold_count + reserved_count + capacity_exceptions < capacity;
        get diagnostics affected = row_count;
        update commerce.launch_checkout_orders set status = 'needs_review',
          capacity_held = case when affected = 1 then true else false end,
          capacity_exception = (affected <> 1), updated_at = pg_catalog.clock_timestamp()
          where commerce_order = p_commerce_order returning * into order_row;
      else
        update commerce.launch_checkout_orders set status = 'needs_review', updated_at = pg_catalog.clock_timestamp()
          where commerce_order = p_commerce_order returning * into order_row;
      end if;
      return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
    end if;
    if lower(p_payer) <> order_row.buyer_email or p_amount <> order_row.amount_minor then
      update commerce.launch_checkout_orders set status = 'needs_review', updated_at = pg_catalog.clock_timestamp()
        where commerce_order = p_commerce_order returning * into order_row;
    elsif order_row.status not in ('payment_confirmed', 'finalized', 'needs_review') then
      update commerce.launch_checkout_orders set status = 'payment_confirmed', updated_at = pg_catalog.clock_timestamp()
        where commerce_order = p_commerce_order returning * into order_row;
    end if;
    return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
  end if;

  if order_row.status = 'finalized' then raise exception 'launch_checkout_status_conflict'; end if;
  terminal_status := case when p_status = 3 then 'rejected' else 'cancelled' end;
  if order_row.status in ('payment_confirmed', 'needs_review') then
    -- A paid/mismatched callback is not undone by a later terminal status without reconciliation.
    update commerce.launch_checkout_orders set status = 'needs_review', updated_at = pg_catalog.clock_timestamp()
      where commerce_order = p_commerce_order returning * into order_row;
  elsif order_row.status not in ('rejected', 'cancelled') then
    if order_row.capacity_held then
      update public.launch_price_tiers set reserved_count = reserved_count - 1, updated_at = pg_catalog.clock_timestamp()
        where id = order_row.tier_id and reserved_count > 0;
      get diagnostics affected = row_count;
      if affected <> 1 then raise exception 'launch_checkout_reservation_missing'; end if;
    end if;
    delete from commerce.ebook_pending_orders where commerce_order = p_commerce_order;
    update commerce.launch_checkout_orders set status = terminal_status, capacity_held = false, updated_at = pg_catalog.clock_timestamp()
      where commerce_order = p_commerce_order returning * into order_row;
  elsif order_row.status <> terminal_status then
    raise exception 'launch_checkout_status_conflict';
  end if;
  return pg_catalog.to_jsonb(order_row) - 'idempotency_key_hash';
end;
$$;

revoke all on commerce.launch_checkout_orders from public, anon, authenticated;
revoke all on function commerce.preserve_launch_checkout_identity() from public, anon, authenticated;
revoke all on function commerce.reserve_launch_checkout(text, bytea, text, text) from public, anon, authenticated;
revoke all on function commerce.attach_launch_flow_order(text, bigint) from public, anon, authenticated;
revoke all on function commerce.mark_launch_checkout_creation_submitted(text) from public, anon, authenticated;
revoke all on function commerce.fail_launch_checkout_creation(text) from public, anon, authenticated;
revoke all on function commerce.mark_launch_checkout_creation_unknown(text) from public, anon, authenticated;
revoke all on function commerce.record_launch_flow_status(text, bigint, integer, text, integer) from public, anon, authenticated;

commit;
