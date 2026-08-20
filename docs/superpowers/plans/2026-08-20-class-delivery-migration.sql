-- Flujo de entrega idempotente para la clase en vivo.
-- Aplicado a producción mediante Supabase MCP el 2026-08-20.
-- Solo las funciones internas usan esta cola: no se expone a anon/authenticated.

create table if not exists commerce.class_delivery_events (
  id uuid primary key default gen_random_uuid(),
  class_order_id uuid not null references commerce.class_orders(id) on delete cascade,
  delivery_kind text not null check (delivery_kind in ('welcome', 'ebooks', 'session-24h', 'session-2h')),
  status text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts >= 1),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_order_id, delivery_kind)
);

alter table commerce.class_delivery_events enable row level security;

create or replace function public.claim_class_delivery(
  p_delivery_kind text,
  p_commerce_order text default null
)
returns table (
  event_id uuid,
  commerce_order text,
  email text,
  offer_label text,
  amount_minor integer,
  flow_token text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_delivery_kind not in ('welcome', 'ebooks', 'session-24h', 'session-2h') then
    raise exception 'invalid delivery kind';
  end if;

  return query
  with candidates as (
    select c.id, c.commerce_order, c.email, o.label, c.amount_minor, c.flow_token
    from commerce.class_orders c
    join commerce.product_offers o on o.id = c.offer_id
    where c.status = 'paid'
      and (p_commerce_order is null or c.commerce_order = p_commerce_order)
  ), claimed as (
    insert into commerce.class_delivery_events as e (class_order_id, delivery_kind, status, attempts, updated_at)
    select id, p_delivery_kind, 'processing', 1, now()
    from candidates
    on conflict (class_order_id, delivery_kind) do update
      set status = 'processing', attempts = e.attempts + 1, last_error = null, updated_at = now()
      where e.status = 'failed' or (e.status = 'processing' and e.updated_at < now() - interval '15 minutes')
    returning e.id, e.class_order_id
  )
  select claimed.id, candidates.commerce_order, candidates.email, candidates.label, candidates.amount_minor, candidates.flow_token
  from claimed
  join candidates on candidates.id = claimed.class_order_id;
end;
$$;

create or replace function public.complete_class_delivery(p_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  update commerce.class_delivery_events
  set status = 'sent', sent_at = now(), updated_at = now(), last_error = null
  where id = p_event_id and status = 'processing'
  returning true;
$$;

create or replace function public.fail_class_delivery(p_event_id uuid, p_error text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  update commerce.class_delivery_events
  set status = 'failed', last_error = left(p_error, 500), updated_at = now()
  where id = p_event_id and status = 'processing'
  returning true;
$$;

create or replace function public.grant_class_ebook_delivery(p_commerce_order text)
returns table (resource text, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_token text;
  v_flow_order bigint;
begin
  select c.email, c.flow_token, c.flow_order
    into v_email, v_token, v_flow_order
  from commerce.class_orders c
  where c.commerce_order = p_commerce_order and c.status = 'paid';

  if v_email is null or v_token is null then
    raise exception 'paid class order not found';
  end if;

  insert into commerce.ebook_purchases (email, amount, flow_token, flow_order, tier, resource)
  select v_email, 0, v_token, v_flow_order, 'class-included', resources.resource
  from (values
    ('ebook:creacion-de-webs-con-ia'),
    ('ebook:creacion-de-webs-con-ia-parte-2'),
    ('ebook:creacion-de-webs-con-ia-parte-3'),
    ('ebook:creacion-de-webs-con-ia-parte-4')
  ) as resources(resource)
  on conflict (flow_token, resource) do nothing;

  return query
  select resources.resource, v_token
  from (values
    ('ebook:creacion-de-webs-con-ia'),
    ('ebook:creacion-de-webs-con-ia-parte-2'),
    ('ebook:creacion-de-webs-con-ia-parte-3'),
    ('ebook:creacion-de-webs-con-ia-parte-4')
  ) as resources(resource);
end;
$$;

create or replace function public.class_delivery_summary()
returns table (paid_count integer)
language sql
security definer
set search_path = ''
as $$
  select count(*)::integer
  from commerce.class_orders
  where status = 'paid';
$$;

revoke all on function public.claim_class_delivery(text, text) from public, anon, authenticated;
revoke all on function public.complete_class_delivery(uuid) from public, anon, authenticated;
revoke all on function public.fail_class_delivery(uuid, text) from public, anon, authenticated;
revoke all on function public.grant_class_ebook_delivery(text) from public, anon, authenticated;
revoke all on function public.class_delivery_summary() from public, anon, authenticated;
grant execute on function public.claim_class_delivery(text, text) to service_role;
grant execute on function public.complete_class_delivery(uuid) to service_role;
grant execute on function public.fail_class_delivery(uuid, text) to service_role;
grant execute on function public.grant_class_ebook_delivery(text) to service_role;
grant execute on function public.class_delivery_summary() to service_role;
