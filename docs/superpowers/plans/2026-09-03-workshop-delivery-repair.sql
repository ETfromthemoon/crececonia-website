-- Reparación forward-only para la entrega del workshop.
-- 1. Elimina la ambigüedad PL/pgSQL de `resource`.
-- 2. Separa rechazos permanentes de destinatario de fallos reintentables.
-- 3. Habilita la notificación interna idempotente de cada compra.

alter table commerce.class_delivery_events
  drop constraint if exists class_delivery_events_delivery_kind_check;
alter table commerce.class_delivery_events
  add constraint class_delivery_events_delivery_kind_check
  check (delivery_kind in ('admin-notification','welcome','hub','ebooks','session-1h','session-10m','session-late','follow-up'));

create or replace function public.claim_workshop_delivery(p_product_key text,p_delivery_kind text,p_commerce_order text default null)
returns table(event_id uuid,commerce_order text,email text,amount_minor integer)
language plpgsql security definer set search_path=''
as $$
begin
 if p_delivery_kind not in ('admin-notification','welcome','ebooks','session-1h','session-10m','session-late','follow-up') then raise exception 'invalid delivery kind'; end if;
 return query with candidates as(
  select c.id,c.commerce_order,c.email,c.amount_minor from commerce.class_orders c join commerce.products p on p.id=c.product_id where p.product_key=p_product_key and c.status='paid' and (p_commerce_order is null or c.commerce_order=p_commerce_order)
 ),claimed as(
  insert into commerce.class_delivery_events as e(class_order_id,delivery_kind,status,attempts,updated_at)
  select id,p_delivery_kind,'processing',1,now() from candidates
  on conflict(class_order_id,delivery_kind) do update set status='processing',attempts=e.attempts+1,last_error=null,updated_at=now()
  where e.status='failed' or(e.status='processing' and e.updated_at<now()-interval '15 minutes') returning e.id,e.class_order_id
 ) select claimed.id,candidates.commerce_order,candidates.email,candidates.amount_minor from claimed join candidates on candidates.id=claimed.class_order_id;
end $$;

create or replace function public.grant_workshop_ebooks(p_commerce_order text,p_resources text[])
returns table(resource text,token text)
language plpgsql security definer set search_path=''
as $$
#variable_conflict use_column
begin
  insert into commerce.ebook_purchases(email,amount,flow_token,flow_order,tier,resource)
  select c.email,0,c.flow_token,c.flow_order,'workshop-included',requested.resource_value
  from commerce.class_orders c
  cross join unnest(p_resources) as requested(resource_value)
  where c.commerce_order=p_commerce_order
    and c.status='paid'
    and c.flow_token is not null
  on conflict do nothing;

  return query
  select requested.resource_value,c.flow_token
  from commerce.class_orders c
  cross join unnest(p_resources) as requested(resource_value)
  where c.commerce_order=p_commerce_order
    and c.status='paid'
    and c.flow_token is not null;
end
$$;

alter table commerce.workshop_checkout_recoveries
  drop constraint if exists workshop_checkout_recoveries_status_check;
alter table commerce.workshop_checkout_recoveries
  add constraint workshop_checkout_recoveries_status_check
  check (status in ('processing','sent','failed','suppressed','redeeming','redeemed'));

create or replace function public.suppress_workshop_checkout_recovery(p_recovery_id uuid,p_error text)
returns boolean language sql security definer set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='suppressed',last_error=left(p_error,500),updated_at=now()
  where id=p_recovery_id and status='processing'
  returning true
$$;

update commerce.workshop_checkout_recoveries
set status='suppressed',updated_at=now()
where status='failed'
  and last_error like 'Invalid `to` field.%';

revoke all on function public.suppress_workshop_checkout_recovery(uuid,text) from public,anon,authenticated;
grant execute on function public.suppress_workshop_checkout_recovery(uuid,text) to service_role;
revoke all on function public.claim_workshop_delivery(text,text,text) from public,anon,authenticated;
grant execute on function public.claim_workshop_delivery(text,text,text) to service_role;
