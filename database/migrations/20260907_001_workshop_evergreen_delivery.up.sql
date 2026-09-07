-- Repara la oferta evergreen y agrega recuperación auditable del acceso.

create or replace function public.workshop_product_availability(p_product_key text)
returns table(
  product_id uuid, product_name text, offer_id uuid, offer_key text, label text,
  amount_minor integer, total_cupos integer, sold_cupos integer,
  reserved_cupos integer, sales_today integer, revenue_today bigint,
  next_amount_minor integer
)
language sql security definer set search_path = '' as $$
  with selected_product as(
    select p.id,p.name from commerce.products p
    where p.product_key=p_product_key and p.status='active' limit 1
  ),upserted_offer as(
    insert into commerce.product_offers(
      product_id,offer_key,label,amount_minor,total_cupos,
      sold_cupos,reserved_cupos,sort_order,status
    )
    select p.id,'recording','Clase grabada',20000,1000000,0,0,1000000,'active'
    from selected_product p
    on conflict on constraint product_offers_product_id_offer_key_key do update
    set label=excluded.label,
        amount_minor=excluded.amount_minor,
        total_cupos=greatest(commerce.product_offers.total_cupos,1000000),
        status='active'
    returning id,product_id,offer_key,label,amount_minor,total_cupos,
      sold_cupos,reserved_cupos
  )
  select p.id,p.name,o.id,o.offer_key,o.label,o.amount_minor,o.total_cupos,
    o.sold_cupos,o.reserved_cupos,
    (select count(*)::integer from commerce.class_orders c
      where c.product_id=p.id and c.status='paid'
        and (c.paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date),
    (select coalesce(sum(c.amount_minor),0)::bigint from commerce.class_orders c
      where c.product_id=p.id and c.status='paid'
        and (c.paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date),
    20000
  from selected_product p join upserted_offer o on o.product_id=p.id
$$;

create table if not exists commerce.workshop_access_recoveries(
  id uuid primary key default gen_random_uuid(),
  class_order_id uuid not null references commerce.class_orders(id) on delete cascade,
  status text not null check(status in('processing','sent','failed')),
  provider_message_id text,
  provider_status text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists workshop_access_recoveries_provider_idx
  on commerce.workshop_access_recoveries(provider_message_id)
  where provider_message_id is not null;
create index if not exists workshop_access_recoveries_order_created_idx
  on commerce.workshop_access_recoveries(class_order_id,created_at desc);

create or replace function public.claim_workshop_access_recovery(p_product_key text,p_email text)
returns table(recovery_id uuid,commerce_order text,email text)
language plpgsql security definer set search_path='' as $$
declare v_order commerce.class_orders%rowtype;
begin
  if p_email is null or length(p_email)>254 then return; end if;
  select c.* into v_order
  from commerce.class_orders c join commerce.products p on p.id=c.product_id
  where p.product_key=p_product_key and c.status='paid'
    and lower(c.email)=lower(trim(p_email))
  order by c.paid_at desc nulls last limit 1;
  if not found then return; end if;
  if exists(select 1 from commerce.workshop_access_recoveries r
    where r.class_order_id=v_order.id and r.created_at>now()-interval '10 minutes') then return; end if;
  return query
    insert into commerce.workshop_access_recoveries(class_order_id,status)
    values(v_order.id,'processing')
    returning id,v_order.commerce_order,v_order.email;
end $$;

create or replace function public.complete_workshop_access_recovery(p_recovery_id uuid,p_provider_message_id text)
returns boolean language sql security definer set search_path='' as $$
  update commerce.workshop_access_recoveries
  set status='sent',provider_message_id=p_provider_message_id,
      provider_status='email.sent',last_error=null,updated_at=now()
  where id=p_recovery_id and status='processing' returning true
$$;

create or replace function public.fail_workshop_access_recovery(p_recovery_id uuid,p_error text)
returns boolean language sql security definer set search_path='' as $$
  update commerce.workshop_access_recoveries
  set status='failed',last_error=left(p_error,500),updated_at=now()
  where id=p_recovery_id and status='processing' returning true
$$;

create or replace function public.requeue_workshop_follow_up(p_product_key text)
returns integer language sql security definer set search_path='' as $$
  with changed as(
    update commerce.class_delivery_events e set status='failed',updated_at=now(),
      last_error='Reenvío de materiales solicitado por administración'
    from commerce.class_orders c join commerce.products p on p.id=c.product_id
    where e.class_order_id=c.id and p.product_key=p_product_key
      and c.status='paid' and e.delivery_kind='follow-up'
    returning e.id
  ) select count(*)::integer from changed
$$;

create or replace function public.record_workshop_email_event(p_provider_message_id text,p_event_type text,p_event_at timestamptz)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_updated integer:=0; v_count integer:=0;
begin
  update commerce.class_delivery_events set
    provider_status=p_event_type,
    delivered_at=case when p_event_type='email.delivered' then coalesce(delivered_at,p_event_at) else delivered_at end,
    bounced_at=case when p_event_type in('email.bounced','email.failed','email.suppressed') then coalesce(bounced_at,p_event_at) else bounced_at end,
    opened_at=case when p_event_type='email.opened' then coalesce(opened_at,p_event_at) else opened_at end,
    clicked_at=case when p_event_type='email.clicked' then coalesce(clicked_at,p_event_at) else clicked_at end,
    updated_at=now()
  where provider_message_id=p_provider_message_id;
  get diagnostics v_count=row_count; v_updated:=v_updated+v_count;
  update commerce.workshop_access_recoveries set provider_status=p_event_type,updated_at=now()
  where provider_message_id=p_provider_message_id;
  get diagnostics v_count=row_count; v_updated:=v_updated+v_count;
  return v_updated>0;
end $$;

create or replace function public.admin_advance_workshop_tier(p_product_key text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_product_id uuid; v_current commerce.product_offers%rowtype; v_next_order integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_product_key));
  select p.id into v_product_id from commerce.products p where p.product_key=p_product_key and p.status='active' limit 1;
  select o.* into v_current from commerce.product_offers o where o.product_id=v_product_id and o.status='active' and o.offer_key<>'recording' order by o.sort_order limit 1 for update;
  if not found then raise exception 'No hay un tramo activo.'; end if;
  update commerce.product_offers set status='retired' where id=v_current.id;
  select coalesce(max(o.sort_order),0)+1 into v_next_order from commerce.product_offers o where o.product_id=v_product_id and o.offer_key<>'recording';
  insert into commerce.product_offers(product_id,offer_key,label,amount_minor,total_cupos,sold_cupos,reserved_cupos,sort_order,status)
  values(v_product_id,'tier-'||v_next_order,'Tramo '||v_next_order,v_current.amount_minor+5000,5,0,0,v_next_order,'active')
  on conflict on constraint product_offers_product_id_offer_key_key do update set label=excluded.label,amount_minor=excluded.amount_minor,total_cupos=excluded.total_cupos,status='active';
  return true;
end $$;

revoke all on function public.workshop_product_availability(text),
  public.claim_workshop_access_recovery(text,text),
  public.complete_workshop_access_recovery(uuid,text),
  public.fail_workshop_access_recovery(uuid,text),
  public.requeue_workshop_follow_up(text),
  public.record_workshop_email_event(text,text,timestamptz),
  public.admin_advance_workshop_tier(text)
from public,anon,authenticated;
grant execute on function public.workshop_product_availability(text),
  public.claim_workshop_access_recovery(text,text),
  public.complete_workshop_access_recovery(uuid,text),
  public.fail_workshop_access_recovery(uuid,text),
  public.requeue_workshop_follow_up(text),
  public.record_workshop_email_event(text,text,timestamptz),
  public.admin_advance_workshop_tier(text)
to service_role;
