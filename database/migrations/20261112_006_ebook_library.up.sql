-- Dormant personal library. No public role can access these tables or functions.
create table commerce.ebook_library_challenges (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 254),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  check (expires_at > created_at)
);
create index ebook_library_challenges_expiry_idx on commerce.ebook_library_challenges(expires_at);

create table commerce.ebook_library_sessions (
  id uuid primary key default gen_random_uuid(),
  session_hash text not null unique check (session_hash ~ '^[0-9a-f]{64}$'),
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 254),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  challenge_id uuid not null references commerce.ebook_library_challenges(id),
  check (expires_at > created_at)
);
create index ebook_library_sessions_email_idx on commerce.ebook_library_sessions(email, expires_at) where revoked_at is null;
create index ebook_library_sessions_challenge_idx on commerce.ebook_library_sessions(challenge_id);

create table commerce.ebook_library_rate_limits (
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (key_hash, window_started_at)
);
create index ebook_library_rate_limits_expiry_idx on commerce.ebook_library_rate_limits(expires_at);

create function commerce.reserve_ebook_library_request(p_email_key text, p_ip_key text)
returns boolean language plpgsql set search_path = '' as $$
declare now_at timestamptz := pg_catalog.clock_timestamp(); email_hour integer; email_day integer; ip_hour integer;
begin
  if p_email_key !~ '^[0-9a-f]{64}$' or p_ip_key !~ '^[0-9a-f]{64}$' then raise exception 'invalid_library_rate_key'; end if;
  delete from commerce.ebook_library_sessions where expires_at <= now_at or revoked_at is not null;
  delete from commerce.ebook_library_challenges c where c.expires_at <= now_at and not exists (select 1 from commerce.ebook_library_sessions s where s.challenge_id=c.id);
  delete from commerce.ebook_library_rate_limits where expires_at <= now_at;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_email_key, 0));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_ip_key, 0));
  -- Fixed calendar windows: bucket edges cannot accidentally expire a recent request.
  select coalesce(sum(request_count),0)::int into email_hour from commerce.ebook_library_rate_limits where key_hash=p_email_key and window_started_at >= date_trunc('hour',now_at);
  select coalesce(sum(request_count),0)::int into email_day from commerce.ebook_library_rate_limits where key_hash=p_email_key and window_started_at >= date_trunc('day',now_at);
  select coalesce(sum(request_count),0)::int into ip_hour from commerce.ebook_library_rate_limits where key_hash=p_ip_key and window_started_at >= date_trunc('hour',now_at);
  if email_hour >= 3 or email_day >= 5 or ip_hour >= 20 then return false; end if;
  insert into commerce.ebook_library_rate_limits values (p_email_key, date_trunc('hour',now_at), 1, now_at + interval '1 day')
    on conflict (key_hash,window_started_at) do update set request_count=commerce.ebook_library_rate_limits.request_count+1;
  insert into commerce.ebook_library_rate_limits values (p_ip_key, date_trunc('hour',now_at), 1, now_at + interval '1 hour')
    on conflict (key_hash,window_started_at) do update set request_count=commerce.ebook_library_rate_limits.request_count+1;
  return true;
end $$;

create function commerce.consume_ebook_library_challenge(p_token_hash text, p_session_hash text)
returns timestamptz language plpgsql set search_path = '' as $$
declare challenge commerce.ebook_library_challenges%rowtype; expiry timestamptz;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' or p_session_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_library_token'; end if;
  select * into challenge from commerce.ebook_library_challenges where token_hash=p_token_hash for update;
  if not found or challenge.consumed_at is not null or challenge.expires_at <= pg_catalog.clock_timestamp() then return null; end if;
  expiry := pg_catalog.clock_timestamp() + interval '8 hours';
  update commerce.ebook_library_challenges set consumed_at=pg_catalog.clock_timestamp() where id=challenge.id;
  insert into commerce.ebook_library_sessions(session_hash,email,expires_at,challenge_id)
    values(p_session_hash,challenge.email,expiry,challenge.id);
  return expiry;
end $$;

create function commerce.revoke_ebook_library_session(p_session_hash text)
returns boolean language sql set search_path = '' as $$
  update commerce.ebook_library_sessions set revoked_at=pg_catalog.clock_timestamp()
  where session_hash=p_session_hash and revoked_at is null returning true
$$;

revoke all on commerce.ebook_library_challenges, commerce.ebook_library_sessions, commerce.ebook_library_rate_limits from public, anon, authenticated;
revoke all on function commerce.reserve_ebook_library_request(text,text), commerce.consume_ebook_library_challenge(text,text), commerce.revoke_ebook_library_session(text) from public, anon, authenticated;
