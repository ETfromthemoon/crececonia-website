-- Apply atomically after 20261112_001. No external calls or credentials in SQL.
begin;
create table commerce.nitido_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  qualification_id uuid not null unique references commerce.service_qualifications(id),
  status text not null default 'pending' check (status in ('pending', 'leased', 'synced', 'needs_review')),
  attempts integer not null default 0 check (attempts between 0 and 8),
  worker_id uuid,
  lease_token uuid,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  operation_id uuid unique,
  reason_code text check (reason_code in ('duplicate_candidate', 'revision_conflict', 'invalid_payload', 'lease_exhausted')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (status <> 'synced' or (operation_id is not null and reason_code is null and completed_at is not null)),
  check (status <> 'needs_review' or (reason_code is not null and operation_id is null and completed_at is not null))
);
create index nitido_sync_ready_idx on commerce.nitido_sync_jobs(next_attempt_at, created_at)
  where status in ('pending', 'leased');

create function commerce.enqueue_nitido_qualification() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if new.payload->>'qualified' = 'true' then
    insert into commerce.nitido_sync_jobs(qualification_id) values (new.id)
      on conflict (qualification_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger enqueue_nitido_qualification after insert on commerce.service_qualifications
  for each row execute function commerce.enqueue_nitido_qualification();
insert into commerce.nitido_sync_jobs(qualification_id)
  select id from commerce.service_qualifications where payload->>'qualified' = 'true'
  on conflict (qualification_id) do nothing;

create function commerce.claim_nitido_sync_job(p_worker uuid) returns table(job jsonb)
language plpgsql set search_path = pg_catalog as $$
declare
  selected commerce.nitido_sync_jobs%rowtype;
begin
  if p_worker is null then raise exception 'invalid worker'; end if;
  -- Expired final attempts remain visible for manual review, never disappear.
  update commerce.nitido_sync_jobs set status = 'needs_review', reason_code = 'lease_exhausted', completed_at = clock_timestamp()
    where status = 'leased' and attempts >= 8 and lease_expires_at <= clock_timestamp();
  select q.* into selected from commerce.nitido_sync_jobs q
    where q.status in ('pending', 'leased') and q.attempts < 8
      and q.next_attempt_at <= clock_timestamp()
      and (q.status = 'pending' or q.lease_expires_at <= clock_timestamp())
    order by q.created_at, q.id for update skip locked limit 1;
  if not found then return; end if;
  update commerce.nitido_sync_jobs q set
    status = 'leased', worker_id = p_worker, lease_token = gen_random_uuid(),
    lease_expires_at = clock_timestamp() + interval '5 minutes',
    next_attempt_at = clock_timestamp() + interval '5 minutes' + make_interval(secs => least(900, 15 * (2 ^ q.attempts)::integer)),
    attempts = q.attempts + 1
    where q.id = selected.id returning q.* into selected;
  return query select jsonb_build_object(
    'id', selected.id, 'leaseToken', selected.lease_token, 'leaseExpiresAt', selected.lease_expires_at,
    'qualification', jsonb_build_object(
      'id', p.id, 'service', p.service, 'name', p.payload->>'name', 'email', p.email,
      'company', p.payload->>'company', 'role', p.payload->>'role', 'availability', p.payload->>'availability',
      'budget', p.payload->>'budget', 'result', p.payload->>'result', 'context', p.payload->>'context', 'decision', p.payload->>'decision'
    )) from commerce.service_qualifications p where p.id = selected.qualification_id;
end;
$$;

create function commerce.ack_nitido_sync_job(p_job uuid, p_token uuid, p_outcome text, p_operation uuid, p_reason text)
returns table(outcome text) language plpgsql set search_path = pg_catalog as $$
declare
  selected commerce.nitido_sync_jobs%rowtype;
begin
  if not coalesce(((p_outcome = 'synced' and p_operation is not null and p_reason is null)
    or (p_outcome = 'needs_review' and p_operation is null and p_reason in ('duplicate_candidate', 'revision_conflict', 'invalid_payload'))), false) then
    return query select 'conflict'::text; return;
  end if;
  select q.* into selected from commerce.nitido_sync_jobs q where q.id = p_job for update;
  if not found or p_token is null or selected.lease_token is distinct from p_token then
    return query select 'conflict'::text; return;
  end if;
  if selected.status in ('synced', 'needs_review') then
    return query select case when selected.status = p_outcome
      and selected.operation_id is not distinct from p_operation
      and selected.reason_code is not distinct from p_reason then 'acknowledged' else 'conflict' end;
    return;
  end if;
  if selected.status <> 'leased' or selected.lease_expires_at <= clock_timestamp() then
    return query select 'conflict'::text; return;
  end if;
  begin
    update commerce.nitido_sync_jobs set status = p_outcome, operation_id = p_operation,
      reason_code = p_reason, completed_at = clock_timestamp() where id = p_job;
  exception when unique_violation then
    return query select 'conflict'::text; return;
  end;
  return query select 'acknowledged'::text;
end;
$$;

-- The queue contains contact details and lease credentials. Only the server-side
-- database role should access it; public API roles use the authenticated route.
revoke all on commerce.nitido_sync_jobs from public, anon, authenticated;
revoke all on function commerce.enqueue_nitido_qualification() from public, anon, authenticated;
revoke all on function commerce.claim_nitido_sync_job(uuid) from public, anon, authenticated;
revoke all on function commerce.ack_nitido_sync_job(uuid, uuid, text, uuid, text) from public, anon, authenticated;
commit;
