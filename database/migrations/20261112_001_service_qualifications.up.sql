create table commerce.service_qualifications (
  id uuid primary key,
  service text not null check (service in ('mentoria', 'implementacion')),
  email text not null,
  payload jsonb not null,
  payload_hash text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz not null default now()
);
create index service_qualifications_status_created_idx on commerce.service_qualifications (status, created_at);
create index service_qualifications_created_idx on commerce.service_qualifications (created_at);
create index service_qualifications_email_created_idx on commerce.service_qualifications (email, created_at);

-- This low-volume intake serializes quota checks and writes across serverless
-- instances. Identical retries return before consuming the submission quota.
create function commerce.register_service_qualification(
  p_id uuid, p_service text, p_email text, p_payload jsonb, p_hash text
) returns table (id uuid, outcome text)
language plpgsql as $$
declare
  existing_hash text;
begin
  perform pg_advisory_xact_lock(20261112, 1);
  select q.payload_hash into existing_hash from commerce.service_qualifications q where q.id = p_id;
  if found then
    return query select p_id, case when existing_hash = p_hash then 'saved' else 'conflict' end;
    return;
  end if;
  if (select count(*) from commerce.service_qualifications q where q.email = p_email and q.created_at > now() - interval '1 hour') >= 3
     or (select count(*) from commerce.service_qualifications q where q.created_at > now() - interval '10 minutes') >= 30 then
    return query select null::uuid, 'rate_limited'::text;
    return;
  end if;
  insert into commerce.service_qualifications (id, service, email, payload, payload_hash)
    values (p_id, p_service, p_email, p_payload, p_hash);
  return query select p_id, 'saved'::text;
end;
$$;
