-- Workshop CrececonIA · 6 septiembre 2026
-- Ejecutar en Supabase antes de habilitar tráfico. Idempotente.

alter table commerce.class_delivery_events add column if not exists provider_message_id text;
alter table commerce.class_delivery_events add column if not exists provider_status text;
alter table commerce.class_delivery_events add column if not exists delivered_at timestamptz;
alter table commerce.class_delivery_events add column if not exists bounced_at timestamptz;
alter table commerce.class_delivery_events add column if not exists opened_at timestamptz;
alter table commerce.class_delivery_events add column if not exists clicked_at timestamptz;
create unique index if not exists class_delivery_provider_message_id_idx on commerce.class_delivery_events(provider_message_id) where provider_message_id is not null;

create table if not exists commerce.workshop_events(id bigint generated always as identity primary key,product_key text not null,event_name text not null check(event_name in('page_view','checkout_started')),session_id text not null,source text,medium text,campaign text,referrer text,created_at timestamptz not null default now());
create unique index if not exists workshop_events_session_event_idx on commerce.workshop_events(product_key,session_id,event_name);
create table if not exists commerce.workshop_attribution(commerce_order text primary key,session_id text,source text,medium text,campaign text,referrer text,created_at timestamptz not null default now());
alter table commerce.workshop_events enable row level security;
alter table commerce.workshop_attribution enable row level security;

alter table commerce.class_aula_settings add column if not exists skool_url text;
alter table commerce.class_aula_settings add column if not exists skills_storage_path text;
alter table commerce.class_aula_settings add column if not exists room_enabled boolean not null default true;

insert into storage.buckets(id,name,public)
values('workshop-assets','workshop-assets',false)
on conflict(id) do update set public=false;

-- Producto y oferta. La capacidad queda sólo en base de datos; nunca se expone al público.
insert into commerce.products (workspace_id, product_key, kind, name, status, delivery_kind)
select
  workspace_id,
  'workshop:workshop-en-vivo-2026-09-06',
  'service',
  'Workshop en vivo de inteligencia artificial aplicada',
  'active',
  'manual'
from commerce.products
where product_key = 'clase:clase-en-vivo-2026-08-23'
limit 1
on conflict (workspace_id, product_key) do update
set name = excluded.name,
    kind = excluded.kind,
    status = 'active',
    delivery_kind = excluded.delivery_kind;

insert into commerce.product_offers (product_id,offer_key,label,amount_minor,total_cupos,sold_cupos,reserved_cupos,sort_order,status)
select id,'general','Primer tramo',20000,5,0,0,1,'active'
from commerce.products where product_key='workshop:workshop-en-vivo-2026-09-06'
on conflict (product_id,offer_key) do update
set label=excluded.label,
    amount_minor=20000,
    total_cupos=case
      when commerce.product_offers.sold_cupos=0 and commerce.product_offers.reserved_cupos=0 then 5
      else commerce.product_offers.total_cupos
    end,
    status='active';

insert into commerce.class_aula_settings(product_key,support_email,room_enabled)
values('workshop:workshop-en-vivo-2026-09-06','sergio@crececonia.cl',true)
on conflict(product_key) do nothing;

create or replace function public.workshop_product_availability(p_product_key text)
returns table(product_id uuid,product_name text,offer_id uuid,offer_key text,label text,amount_minor integer,total_cupos integer,sold_cupos integer,reserved_cupos integer,sales_today integer,revenue_today bigint)
language sql security definer set search_path=''
as $$
 select p.id,p.name,o.id,o.offer_key,o.label,o.amount_minor,o.total_cupos,o.sold_cupos,o.reserved_cupos,
   (select count(*)::integer from commerce.class_orders c where c.product_id=p.id and c.status='paid' and (c.paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date),
   (select coalesce(sum(c.amount_minor),0)::bigint from commerce.class_orders c where c.product_id=p.id and c.status='paid' and (c.paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date)
 from commerce.products p join commerce.product_offers o on o.product_id=p.id
 where p.product_key=p_product_key and p.status='active' and o.status='active'
 order by o.sort_order limit 1;
$$;

create or replace function public.get_workshop_order(p_commerce_order text,p_product_key text)
returns table(id uuid,email text,amount_minor integer,offer_label text,status text)
language sql security definer set search_path=''
as $$ select c.id,c.email,c.amount_minor,o.label,c.status from commerce.class_orders c join commerce.products p on p.id=c.product_id join commerce.product_offers o on o.id=c.offer_id where c.commerce_order=p_commerce_order and p.product_key=p_product_key limit 1 $$;

create or replace function public.claim_workshop_delivery(p_product_key text,p_delivery_kind text,p_commerce_order text default null)
returns table(event_id uuid,commerce_order text,email text,amount_minor integer)
language plpgsql security definer set search_path=''
as $$
begin
 if p_delivery_kind not in ('welcome','ebooks','session-1h','session-10m','session-late','follow-up') then raise exception 'invalid delivery kind'; end if;
 return query with candidates as(
  select c.id,c.commerce_order,c.email,c.amount_minor from commerce.class_orders c join commerce.products p on p.id=c.product_id where p.product_key=p_product_key and c.status='paid' and (p_commerce_order is null or c.commerce_order=p_commerce_order)
 ),claimed as(
  insert into commerce.class_delivery_events as e(class_order_id,delivery_kind,status,attempts,updated_at)
  select id,p_delivery_kind,'processing',1,now() from candidates
  on conflict(class_order_id,delivery_kind) do update set status='processing',attempts=e.attempts+1,last_error=null,updated_at=now()
  where e.status='failed' or(e.status='processing' and e.updated_at<now()-interval '15 minutes') returning e.id,e.class_order_id
 ) select claimed.id,candidates.commerce_order,candidates.email,candidates.amount_minor from claimed join candidates on candidates.id=claimed.class_order_id;
end $$;

create or replace function public.complete_workshop_delivery(p_event_id uuid,p_provider_message_id text)
returns boolean language sql security definer set search_path=''
as $$ update commerce.class_delivery_events set status='sent',provider_message_id=p_provider_message_id,provider_status='email.sent',sent_at=now(),updated_at=now(),last_error=null where id=p_event_id and status='processing' returning true $$;

create or replace function public.grant_workshop_ebooks(p_commerce_order text,p_resources text[])
returns table(resource text,token text) language plpgsql security definer set search_path=''
as $$
begin
 insert into commerce.ebook_purchases(email,amount,flow_token,flow_order,tier,resource)
 select c.email,0,c.flow_token,c.flow_order,'workshop-included',r.resource from commerce.class_orders c cross join unnest(p_resources) as r(resource)
 where c.commerce_order=p_commerce_order and c.status='paid' and c.flow_token is not null on conflict(flow_token,resource) do nothing;
 return query select r.resource,c.flow_token from commerce.class_orders c cross join unnest(p_resources) as r(resource) where c.commerce_order=p_commerce_order and c.status='paid' and c.flow_token is not null;
end $$;

create or replace function public.get_workshop_room_access(p_product_key text,p_commerce_order text)
returns table(flow_token text) language sql security definer set search_path=''
as $$ select c.flow_token from commerce.class_orders c join commerce.products p on p.id=c.product_id where p.product_key=p_product_key and c.commerce_order=p_commerce_order and c.status='paid' and c.flow_token is not null limit 1 $$;

create or replace function public.get_workshop_settings(p_product_key text)
returns table(session_url text,recording_url text,skool_url text,skills_storage_path text,support_email text,room_enabled boolean,updated_at timestamptz)
language sql security definer set search_path=''
as $$ select session_url,recording_url,skool_url,skills_storage_path,support_email,room_enabled,updated_at from commerce.class_aula_settings where product_key=p_product_key $$;

create or replace function public.upsert_workshop_settings(p_product_key text,p_session_url text,p_recording_url text,p_skool_url text,p_skills_storage_path text,p_support_email text,p_room_enabled boolean)
returns table(session_url text,recording_url text,skool_url text,skills_storage_path text,support_email text,room_enabled boolean,updated_at timestamptz)
language plpgsql security definer set search_path=''
as $$ begin return query insert into commerce.class_aula_settings as s(product_key,session_url,recording_url,skool_url,skills_storage_path,support_email,room_enabled,updated_at) values(p_product_key,p_session_url,p_recording_url,p_skool_url,p_skills_storage_path,p_support_email,p_room_enabled,now()) on conflict(product_key) do update set session_url=excluded.session_url,recording_url=excluded.recording_url,skool_url=excluded.skool_url,skills_storage_path=excluded.skills_storage_path,support_email=excluded.support_email,room_enabled=excluded.room_enabled,updated_at=now() returning s.session_url,s.recording_url,s.skool_url,s.skills_storage_path,s.support_email,s.room_enabled,s.updated_at; end $$;

create or replace function public.record_workshop_email_event(p_provider_message_id text,p_event_type text,p_event_at timestamptz)
returns boolean language sql security definer set search_path=''
as $$ update commerce.class_delivery_events set provider_status=p_event_type,delivered_at=case when p_event_type='email.delivered' then coalesce(delivered_at,p_event_at) else delivered_at end,bounced_at=case when p_event_type in('email.bounced','email.failed','email.suppressed') then coalesce(bounced_at,p_event_at) else bounced_at end,opened_at=case when p_event_type='email.opened' then coalesce(opened_at,p_event_at) else opened_at end,clicked_at=case when p_event_type='email.clicked' then coalesce(clicked_at,p_event_at) else clicked_at end,updated_at=now() where provider_message_id=p_provider_message_id returning true $$;

create or replace function public.record_workshop_event(p_product_key text,p_event_name text,p_session_id text,p_source text,p_medium text,p_campaign text,p_referrer text)
returns boolean language sql security definer set search_path=''
as $$ insert into commerce.workshop_events(product_key,event_name,session_id,source,medium,campaign,referrer) values(p_product_key,p_event_name,left(p_session_id,64),left(p_source,160),left(p_medium,160),left(p_campaign,160),left(p_referrer,500)) on conflict(product_key,session_id,event_name) do nothing returning true $$;

create or replace function public.record_workshop_attribution(p_commerce_order text,p_session_id text,p_source text,p_medium text,p_campaign text,p_referrer text)
returns boolean language sql security definer set search_path=''
as $$ insert into commerce.workshop_attribution(commerce_order,session_id,source,medium,campaign,referrer) values(p_commerce_order,left(p_session_id,64),left(p_source,160),left(p_medium,160),left(p_campaign,160),left(p_referrer,500)) on conflict(commerce_order) do nothing returning true $$;

create or replace function public.workshop_admin_dashboard(p_product_key text)
returns jsonb language sql security definer set search_path=''
as $$
with product as(select id from commerce.products where product_key=p_product_key),orders as(select c.* from commerce.class_orders c join product p on p.id=c.product_id),deliveries as(select e.*,c.email from commerce.class_delivery_events e join orders c on c.id=e.class_order_id),stats as(select count(*) filter(where status='paid')::int paid,coalesce(sum(amount_minor) filter(where status='paid'),0)::bigint revenue,count(*) filter(where status='paid' and(paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date)::int sales_today,coalesce(sum(amount_minor) filter(where status='paid' and(paid_at at time zone 'America/Santiago')::date=(now() at time zone 'America/Santiago')::date),0)::bigint revenue_today,count(*) filter(where status='paid' and paid_at>=now()-interval '1 hour')::int sales_last_hour,count(*) filter(where status='created')::int active_reservations,count(*)::int total_orders from orders),funnel as(select count(distinct session_id)filter(where event_name='page_view')::int views,count(distinct session_id)filter(where event_name='checkout_started')::int starts from commerce.workshop_events where product_key=p_product_key),mail as(select count(*) filter(where delivered_at is not null)::numeric delivered,count(*) filter(where bounced_at is not null)::numeric bounced,count(*) filter(where provider_message_id is not null)::numeric tracked,count(*) filter(where status='failed')::int failures from deliveries)
select jsonb_build_object('generatedAt',now(),'metrics',jsonb_build_object('paid',s.paid,'revenue',s.revenue,'salesToday',s.sales_today,'revenueToday',s.revenue_today,'averageTicket',case when s.paid>0 then round(s.revenue::numeric/s.paid)::int else 0 end,'paymentConversion',case when s.total_orders>0 then round(100.0*s.paid/s.total_orders,1) else 0 end,'landingViews',f.views,'checkoutStarts',f.starts,'checkoutRate',case when f.views>0 then round(100.0*f.starts/f.views,1) else 0 end,'visitorConversion',case when f.views>0 then round(100.0*s.paid/f.views,1) else 0 end,'salesLastHour',s.sales_last_hour,'activeReservations',s.active_reservations,'deliveryRate',case when m.tracked>0 then round(100.0*m.delivered/m.tracked,1) else 0 end,'bounceRate',case when m.tracked>0 then round(100.0*m.bounced/m.tracked,1) else 0 end,'deliveryFailures',m.failures),'orders',coalesce((select jsonb_agg(jsonb_build_object('commerce_order',commerce_order,'email',email,'amount_minor',amount_minor,'status',status,'paid_at',paid_at,'created_at',created_at)order by created_at desc)from orders),'[]'::jsonb),'deliveries',coalesce((select jsonb_agg(jsonb_build_object('email',email,'delivery_kind',delivery_kind,'status',status,'provider_status',provider_status,'sent_at',sent_at,'delivered_at',delivered_at,'last_error',last_error)order by created_at desc)from deliveries),'[]'::jsonb),'channels',coalesce((select jsonb_agg(row_to_json(ch))from(select coalesce(a.source,'directo')source,count(*)filter(where o.status='paid')sales,coalesce(sum(o.amount_minor)filter(where o.status='paid'),0)revenue from orders o left join commerce.workshop_attribution a using(commerce_order)group by 1 order by sales desc)ch),'[]'::jsonb)) from stats s cross join funnel f cross join mail m;
$$;

revoke all on function public.workshop_product_availability(text),public.get_workshop_order(text,text),public.claim_workshop_delivery(text,text,text),public.complete_workshop_delivery(uuid,text),public.grant_workshop_ebooks(text,text[]),public.get_workshop_room_access(text,text),public.get_workshop_settings(text),public.upsert_workshop_settings(text,text,text,text,text,text,boolean),public.record_workshop_email_event(text,text,timestamptz),public.record_workshop_event(text,text,text,text,text,text,text),public.record_workshop_attribution(text,text,text,text,text,text),public.workshop_admin_dashboard(text) from public,anon,authenticated;
grant execute on function public.workshop_product_availability(text),public.get_workshop_order(text,text),public.claim_workshop_delivery(text,text,text),public.complete_workshop_delivery(uuid,text),public.grant_workshop_ebooks(text,text[]),public.get_workshop_room_access(text,text),public.get_workshop_settings(text),public.upsert_workshop_settings(text,text,text,text,text,text,boolean),public.record_workshop_email_event(text,text,timestamptz),public.record_workshop_event(text,text,text,text,text,text,text),public.record_workshop_attribution(text,text,text,text,text,text),public.workshop_admin_dashboard(text) to service_role;
