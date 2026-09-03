-- Reparación forward-only para la entrega del workshop.
-- 1. Elimina la ambigüedad PL/pgSQL de `resource`.
-- 2. Separa rechazos permanentes de destinatario de fallos reintentables.

create or replace function public.grant_workshop_ebooks(p_commerce_order text,p_resources text[])
returns table(resource text,token text)
language plpgsql security definer set search_path=''
as $$
begin
  insert into commerce.ebook_purchases(email,amount,flow_token,flow_order,tier,resource)
  select c.email,0,c.flow_token,c.flow_order,'workshop-included',r.resource
  from commerce.class_orders c
  cross join unnest(p_resources) as r(resource)
  where c.commerce_order=p_commerce_order
    and c.status='paid'
    and c.flow_token is not null
  on conflict do nothing;

  return query
  select r.resource,c.flow_token
  from commerce.class_orders c
  cross join unnest(p_resources) as r(resource)
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
