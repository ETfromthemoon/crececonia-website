-- Reemplaza recordatorios de la clase: solo envía Zoom 60 y 10 minutos antes.
-- El secreto se conserva únicamente en Supabase Vault y en la variable
-- CRON_SECRET de Vercel; no copiar su valor a este archivo.

alter table commerce.class_delivery_events
  drop constraint if exists class_delivery_events_delivery_kind_check;
alter table commerce.class_delivery_events
  add constraint class_delivery_events_delivery_kind_check
  check (delivery_kind in ('welcome', 'ebooks', 'session-1h', 'session-10m'));

create or replace function public.claim_class_delivery(
  p_delivery_kind text,
  p_commerce_order text default null
)
returns table (event_id uuid, commerce_order text, email text, offer_label text, amount_minor integer, flow_token text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_delivery_kind not in ('welcome', 'ebooks', 'session-1h', 'session-10m') then
    raise exception 'invalid delivery kind';
  end if;

  return query
  with candidates as (
    select c.id, c.commerce_order, c.email, o.label, c.amount_minor, c.flow_token
    from commerce.class_orders c join commerce.product_offers o on o.id = c.offer_id
    where c.status = 'paid' and (p_commerce_order is null or c.commerce_order = p_commerce_order)
  ), claimed as (
    insert into commerce.class_delivery_events as e (class_order_id, delivery_kind, status, attempts, updated_at)
    select id, p_delivery_kind, 'processing', 1, now() from candidates
    on conflict (class_order_id, delivery_kind) do update
      set status = 'processing', attempts = e.attempts + 1, last_error = null, updated_at = now()
      where e.status = 'failed' or (e.status = 'processing' and e.updated_at < now() - interval '15 minutes')
    returning e.id, e.class_order_id
  )
  select claimed.id, candidates.commerce_order, candidates.email, candidates.label, candidates.amount_minor, candidates.flow_token
  from claimed join candidates on candidates.id = claimed.class_order_id;
end;
$$;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- En producción, crear o actualizar `class_delivery_cron_secret` en Vault con
-- el mismo valor de CRON_SECRET de Vercel antes de programar los dos jobs.
-- Horas UTC: 21:00 = 17:00 Chile (60 min antes); 21:50 = 17:50 Chile (10 min antes).
-- Cada comando programado usa net.http_get con Authorization desde Vault.
