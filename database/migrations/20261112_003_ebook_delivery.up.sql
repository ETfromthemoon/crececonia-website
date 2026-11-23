-- Dormant outbox: no historical backfill, webhook change or scheduled sender.
create table commerce.ebook_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  flow_order bigint not null check (flow_order > 0),
  commerce_order text not null check (length(commerce_order) between 1 and 200),
  delivery_kind text not null default 'buyer_delivery' check (delivery_kind = 'buyer_delivery'),
  -- Freeze the complete provider request, including links and subject, before claiming.
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'provider_accepted', 'retry', 'needs_review')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  first_attempt_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  provider_message_id text,
  provider_accepted_at timestamptz,
  last_error_code text check (last_error_code in ('provider_transient', 'provider_rejected', 'provider_unknown', 'lease_expired', 'attempts_exhausted', 'idempotency_window_expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (flow_order, delivery_kind),
  check ((status = 'processing') = (lease_token is not null and lease_expires_at is not null)),
  check ((status = 'provider_accepted') = (provider_message_id is not null and provider_accepted_at is not null)),
  check (attempts = 0 or first_attempt_at is not null)
);
create index ebook_delivery_jobs_due_idx on commerce.ebook_delivery_jobs (next_attempt_at, created_at)
  where status in ('pending', 'retry');
create index ebook_delivery_jobs_lease_idx on commerce.ebook_delivery_jobs (lease_expires_at)
  where status = 'processing';

create function commerce.preserve_ebook_delivery_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.flow_order is distinct from old.flow_order
     or new.commerce_order is distinct from old.commerce_order
     or new.delivery_kind is distinct from old.delivery_kind or new.payload is distinct from old.payload then
    raise exception 'ebook_delivery_identity_immutable';
  end if;
  return new;
end;
$$;
create trigger ebook_delivery_identity_immutable before update on commerce.ebook_delivery_jobs
  for each row execute function commerce.preserve_ebook_delivery_identity();

-- Can be called by a future payment finalizer inside the same transaction as grants.
-- There is deliberately no FK to one purchase row: a single order may grant a bundle.
create function commerce.enqueue_ebook_delivery(p_flow_order bigint, p_commerce_order text, p_payload jsonb)
returns table (job_id uuid, outcome text)
language plpgsql set search_path = '' as $$
declare
  existing commerce.ebook_delivery_jobs%rowtype;
  inserted_id uuid;
begin
  if p_flow_order is null or p_flow_order <= 0 or p_commerce_order is null
     or length(p_commerce_order) not between 1 and 200 or p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or p_payload - array['from', 'to', 'subject', 'html'] <> '{}'::jsonb
     or not (p_payload ?& array['from', 'to', 'subject', 'html'])
     or jsonb_typeof(p_payload->'from') <> 'string' or length(p_payload->>'from') not between 1 and 320
     or jsonb_typeof(p_payload->'to') <> 'string' or length(p_payload->>'to') not between 1 and 254
     or jsonb_typeof(p_payload->'subject') <> 'string' or length(p_payload->>'subject') not between 1 and 200
     or jsonb_typeof(p_payload->'html') <> 'string' or length(p_payload->>'html') not between 1 and 500000 then
    raise exception 'invalid_ebook_delivery_payload';
  end if;
  insert into commerce.ebook_delivery_jobs (flow_order, commerce_order, payload)
    values (p_flow_order, p_commerce_order, p_payload)
    on conflict (flow_order, delivery_kind) do nothing returning id into inserted_id;
  if inserted_id is not null then
    return query select inserted_id, 'enqueued'::text;
    return;
  end if;
  select * into existing from commerce.ebook_delivery_jobs j
    where j.flow_order = p_flow_order and j.delivery_kind = 'buyer_delivery' for update;
  if existing.commerce_order <> p_commerce_order or existing.payload <> p_payload then
    raise exception 'ebook_delivery_payload_conflict';
  end if;
  return query select existing.id, 'existing'::text;
end;
$$;

create function commerce.claim_ebook_deliveries(p_limit integer default 10)
returns table (job_id uuid, flow_order text, commerce_order text, payload jsonb,
  idempotency_key text, lease_token uuid, lease_expires_at timestamptz, attempts integer,
  first_attempt_at timestamptz)
language plpgsql set search_path = '' as $$
declare
  checked_at timestamptz := clock_timestamp();
begin
  if p_limit is null or p_limit not between 1 and 50 then
    raise exception 'invalid_ebook_delivery_claim_limit';
  end if;
  -- Do not reclaim an active lease. Past the conservative 23h replay window,
  -- acceptance is uncertain: an operator must reconcile instead of sending again.
  with expired as (
    select j.id from commerce.ebook_delivery_jobs j
    where j.status in ('pending', 'retry', 'processing')
      and (j.status <> 'processing' or j.lease_expires_at <= checked_at)
      and (j.attempts >= 5 or j.first_attempt_at <= checked_at - interval '23 hours')
    for update skip locked
  )
  update commerce.ebook_delivery_jobs j set status = 'needs_review', lease_token = null,
    lease_expires_at = null, updated_at = checked_at,
    last_error_code = case when j.first_attempt_at <= checked_at - interval '23 hours'
      then 'idempotency_window_expired' else 'attempts_exhausted' end
    from expired where j.id = expired.id;

  return query with candidates as (
    select j.id from commerce.ebook_delivery_jobs j
    where ((j.status in ('pending', 'retry') and j.next_attempt_at <= checked_at)
        or (j.status = 'processing' and j.lease_expires_at <= checked_at))
      and j.attempts < 5
      and (j.first_attempt_at is null or j.first_attempt_at > checked_at - interval '23 hours')
    order by j.next_attempt_at, j.created_at, j.id
    limit p_limit for update skip locked
  ), claimed as (
    update commerce.ebook_delivery_jobs j set status = 'processing', attempts = j.attempts + 1,
      first_attempt_at = coalesce(j.first_attempt_at, checked_at), lease_token = gen_random_uuid(),
      lease_expires_at = least(checked_at + interval '2 minutes', coalesce(j.first_attempt_at, checked_at) + interval '23 hours'),
      last_error_code = case when j.status = 'processing' then 'lease_expired' else j.last_error_code end,
      updated_at = checked_at
      from candidates where j.id = candidates.id returning j.*
  ) select c.id, c.flow_order::text, c.commerce_order, c.payload,
      'ebook-buyer-delivery/' || c.id::text, c.lease_token, c.lease_expires_at, c.attempts, c.first_attempt_at
    from claimed c;
end;
$$;

create function commerce.accept_ebook_delivery(p_job_id uuid, p_lease_token uuid, p_provider_message_id text)
returns boolean language plpgsql set search_path = '' as $$
begin
  if p_provider_message_id is null or length(btrim(p_provider_message_id)) not between 1 and 200 then
    raise exception 'invalid_ebook_delivery_provider_id';
  end if;
  update commerce.ebook_delivery_jobs j set status = 'provider_accepted',
    provider_message_id = p_provider_message_id, provider_accepted_at = clock_timestamp(),
    lease_token = null, lease_expires_at = null, last_error_code = null, updated_at = clock_timestamp()
    where j.id = p_job_id and j.status = 'processing' and j.lease_token = p_lease_token
      and j.lease_expires_at > clock_timestamp();
  return found;
end;
$$;

create function commerce.fail_ebook_delivery(p_job_id uuid, p_lease_token uuid, p_error_code text)
returns boolean language plpgsql set search_path = '' as $$
declare
  checked_at timestamptz := clock_timestamp();
  safe_code text := case when p_error_code in ('provider_transient', 'provider_rejected', 'provider_unknown')
    then p_error_code else 'provider_unknown' end;
begin
  update commerce.ebook_delivery_jobs j set
    status = case when safe_code = 'provider_rejected' or j.attempts >= 5
      or j.first_attempt_at <= checked_at - interval '23 hours' then 'needs_review' else 'retry' end,
    next_attempt_at = checked_at + make_interval(secs => least(1800, 30 * (2 ^ (j.attempts - 1)))::double precision),
    last_error_code = case when j.first_attempt_at <= checked_at - interval '23 hours' then 'idempotency_window_expired'
      when j.attempts >= 5 then 'attempts_exhausted' else safe_code end,
    lease_token = null, lease_expires_at = null, updated_at = checked_at
    where j.id = p_job_id and j.status = 'processing' and j.lease_token = p_lease_token
      and j.lease_expires_at > checked_at;
  return found;
end;
$$;

-- Functions use invoker privileges, not SECURITY DEFINER. The server DB owner can
-- execute; anonymous legacy roles must not read private delivery payloads or claim jobs.
revoke all on commerce.ebook_delivery_jobs from public, anon, authenticated;
revoke all on function commerce.preserve_ebook_delivery_identity() from public, anon, authenticated;
revoke all on function commerce.enqueue_ebook_delivery(bigint, text, jsonb) from public, anon, authenticated;
revoke all on function commerce.claim_ebook_deliveries(integer) from public, anon, authenticated;
revoke all on function commerce.accept_ebook_delivery(uuid, uuid, text) from public, anon, authenticated;
revoke all on function commerce.fail_ebook_delivery(uuid, uuid, text) from public, anon, authenticated;
