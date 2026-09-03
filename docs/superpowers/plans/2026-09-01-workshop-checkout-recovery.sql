-- Recuperación de checkout abandonado del workshop.
-- Forward-only y compatible con el código actual: añade una outbox independiente,
-- tokens de un solo propósito y RPCs privadas para el service role.

create table if not exists commerce.workshop_checkout_recoveries (
  id uuid primary key default gen_random_uuid(),
  class_order_id uuid not null unique references commerce.class_orders(id) on delete cascade,
  product_key text not null,
  email text not null,
  original_amount integer not null check (original_amount > 0),
  discounted_amount integer not null check (discounted_amount > 0),
  token_hash text unique,
  status text not null default 'processing' check (status in ('processing','sent','failed','suppressed','redeeming','redeemed')),
  attempts integer not null default 1,
  provider_message_id text unique,
  provider_status text,
  sent_at timestamptz,
  delivered_at timestamptz,
  bounced_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  expires_at timestamptz,
  recovered_commerce_order text,
  payment_url text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table commerce.workshop_checkout_recoveries enable row level security;
create index if not exists workshop_checkout_recoveries_product_status_idx
  on commerce.workshop_checkout_recoveries(product_key, status, created_at);
create index if not exists workshop_checkout_recoveries_email_idx
  on commerce.workshop_checkout_recoveries(lower(email));

create or replace function public.claim_workshop_checkout_recoveries(p_product_key text)
returns table(recovery_id uuid, email text, original_amount integer, discounted_amount integer)
language plpgsql
security definer
set search_path=''
as $$
begin
  perform commerce.release_expired_class_reservations();

  return query
  with candidates as (
    select c.id, c.email, c.amount_minor
    from commerce.class_orders c
    join commerce.products p on p.id = c.product_id
    where p.product_key = p_product_key
      and c.status = 'released'
      and c.created_at <= now() - interval '30 minutes'
      and not exists (
        select 1
        from commerce.class_orders paid
        where paid.product_id = c.product_id
          and lower(paid.email) = lower(c.email)
          and paid.status = 'paid'
      )
  ), claimed as (
    insert into commerce.workshop_checkout_recoveries as recovery (
      class_order_id,
      product_key,
      email,
      original_amount,
      discounted_amount,
      status,
      attempts,
      updated_at
    )
    select
      candidates.id,
      p_product_key,
      candidates.email,
      candidates.amount_minor,
      round(candidates.amount_minor::numeric * 0.90)::integer,
      'processing',
      1,
      now()
    from candidates
    on conflict (class_order_id) do update
      set status = 'processing',
          attempts = recovery.attempts + 1,
          last_error = null,
          updated_at = now()
      where recovery.status = 'failed'
         or (recovery.status = 'processing' and recovery.updated_at < now() - interval '15 minutes')
    returning recovery.id, recovery.email, recovery.original_amount, recovery.discounted_amount
  )
  select claimed.id, claimed.email, claimed.original_amount, claimed.discounted_amount
  from claimed;
end
$$;

create or replace function public.complete_workshop_checkout_recovery(
  p_recovery_id uuid,
  p_token_hash text,
  p_provider_message_id text
)
returns boolean
language sql
security definer
set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='sent',
      token_hash=p_token_hash,
      provider_message_id=p_provider_message_id,
      provider_status='email.sent',
      sent_at=now(),
      expires_at=now() + interval '48 hours',
      last_error=null,
      updated_at=now()
  where id=p_recovery_id and status='processing'
  returning true
$$;

create or replace function public.fail_workshop_checkout_recovery(p_recovery_id uuid, p_error text)
returns boolean
language sql
security definer
set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='failed', last_error=left(p_error,500), updated_at=now()
  where id=p_recovery_id and status='processing'
  returning true
$$;

create or replace function public.suppress_workshop_checkout_recovery(p_recovery_id uuid, p_error text)
returns boolean
language sql
security definer
set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='suppressed', last_error=left(p_error,500), updated_at=now()
  where id=p_recovery_id and status='processing'
  returning true
$$;

create or replace function public.begin_workshop_recovery_redemption(p_token_hash text, p_product_key text)
returns table(recovery_id uuid, email text, discounted_amount integer, payment_url text)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_email text;
  v_discounted_amount integer;
  v_payment_url text;
  v_status text;
  v_updated_at timestamptz;
  v_expires_at timestamptz;
  v_product_id uuid;
begin
  select r.id, r.email, r.discounted_amount, r.payment_url, r.status, r.updated_at, r.expires_at, p.id
  into v_id, v_email, v_discounted_amount, v_payment_url, v_status, v_updated_at, v_expires_at, v_product_id
  from commerce.workshop_checkout_recoveries r
  join commerce.products p on p.product_key=r.product_key
  where r.token_hash=p_token_hash
    and r.product_key=p_product_key
  for update of r;

  if not found or v_expires_at <= now() then return; end if;
  if exists (
    select 1 from commerce.class_orders c
    where c.product_id=v_product_id and lower(c.email)=lower(v_email) and c.status='paid'
  ) then return; end if;

  if v_payment_url is not null then
    return query select v_id, v_email, v_discounted_amount, v_payment_url;
    return;
  end if;

  if v_status='sent'
     or (v_status='redeeming' and v_updated_at < now() - interval '10 minutes') then
    update commerce.workshop_checkout_recoveries
    set status='redeeming', updated_at=now(), last_error=null
    where id=v_id;
    return query select v_id, v_email, v_discounted_amount, null::text;
  end if;
end
$$;

create or replace function public.complete_workshop_recovery_redemption(
  p_recovery_id uuid,
  p_commerce_order text,
  p_payment_url text
)
returns boolean
language sql
security definer
set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='redeemed', recovered_commerce_order=p_commerce_order, payment_url=p_payment_url, updated_at=now(), last_error=null
  where id=p_recovery_id and status='redeeming'
  returning true
$$;

create or replace function public.fail_workshop_recovery_redemption(p_recovery_id uuid, p_error text)
returns boolean
language sql
security definer
set search_path=''
as $$
  update commerce.workshop_checkout_recoveries
  set status='sent', last_error=left(p_error,500), updated_at=now()
  where id=p_recovery_id and status='redeeming'
  returning true
$$;

create or replace function public.record_workshop_email_event(
  p_provider_message_id text,
  p_event_type text,
  p_event_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  changed boolean := false;
begin
  update commerce.class_delivery_events
  set provider_status=p_event_type,
      delivered_at=case when p_event_type='email.delivered' then coalesce(delivered_at,p_event_at) else delivered_at end,
      bounced_at=case when p_event_type in('email.bounced','email.failed','email.suppressed') then coalesce(bounced_at,p_event_at) else bounced_at end,
      opened_at=case when p_event_type='email.opened' then coalesce(opened_at,p_event_at) else opened_at end,
      clicked_at=case when p_event_type='email.clicked' then coalesce(clicked_at,p_event_at) else clicked_at end,
      updated_at=now()
  where provider_message_id=p_provider_message_id;
  changed := found;

  update commerce.workshop_checkout_recoveries
  set provider_status=p_event_type,
      delivered_at=case when p_event_type='email.delivered' then coalesce(delivered_at,p_event_at) else delivered_at end,
      bounced_at=case when p_event_type in('email.bounced','email.failed','email.suppressed') then coalesce(bounced_at,p_event_at) else bounced_at end,
      opened_at=case when p_event_type='email.opened' then coalesce(opened_at,p_event_at) else opened_at end,
      clicked_at=case when p_event_type='email.clicked' then coalesce(clicked_at,p_event_at) else clicked_at end,
      updated_at=now()
  where provider_message_id=p_provider_message_id;
  return changed or found;
end
$$;

revoke all on function public.claim_workshop_checkout_recoveries(text),
  public.complete_workshop_checkout_recovery(uuid,text,text),
  public.fail_workshop_checkout_recovery(uuid,text),
  public.suppress_workshop_checkout_recovery(uuid,text),
  public.begin_workshop_recovery_redemption(text,text),
  public.complete_workshop_recovery_redemption(uuid,text,text),
  public.fail_workshop_recovery_redemption(uuid,text)
from public, anon, authenticated;

grant execute on function public.claim_workshop_checkout_recoveries(text),
  public.complete_workshop_checkout_recovery(uuid,text,text),
  public.fail_workshop_checkout_recovery(uuid,text),
  public.suppress_workshop_checkout_recovery(uuid,text),
  public.begin_workshop_recovery_redemption(text,text),
  public.complete_workshop_recovery_redemption(uuid,text,text),
  public.fail_workshop_recovery_redemption(uuid,text),
  public.record_workshop_email_event(text,text,timestamptz)
to service_role;
