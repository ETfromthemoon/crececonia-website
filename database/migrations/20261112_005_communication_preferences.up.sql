begin;

-- Preparatory registry only: no historical grants, campaigns or send jobs.
create table commerce.communication_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  revision bigint not null default 0 check (revision >= 0),
  last_suppressed_revision bigint not null default 0 check (last_suppressed_revision >= 0 and last_suppressed_revision <= revision),
  global_state text not null default 'unknown' check (global_state in ('unknown', 'allowed', 'suppressed')),
  updated_at timestamptz not null default clock_timestamp()
);
create table commerce.communication_preferences (
  contact_id uuid not null references commerce.communication_contacts(id),
  purpose text not null check (purpose in ('newsletter', 'launch_notice')),
  resource text not null,
  state text not null check (state in ('granted', 'suppressed')),
  revision bigint not null check (revision > 0),
  primary key (contact_id, purpose, resource),
  check ((purpose = 'newsletter' and resource = '') or (purpose = 'launch_notice' and resource ~ '^ebook:[a-z0-9-]{1,160}$'))
);
create table commerce.communication_preference_events (
  request_id uuid primary key,
  command_hash text not null check (command_hash ~ '^[a-f0-9]{64}$'),
  contact_id uuid not null references commerce.communication_contacts(id),
  revision bigint not null check (revision > 0),
  action text not null check (action in ('grant', 'suppress', 'suppress_all', 'allow_global')),
  purpose text,
  resource text,
  source text not null check (source in ('verified_user', 'verified_admin', 'synthetic_test')),
  text_version text not null check (length(text_version) between 1 and 120),
  evidence_id uuid not null,
  recorded_at timestamptz not null default clock_timestamp(),
  unique (contact_id, revision),
  check ((action in ('suppress_all', 'allow_global') and purpose is null and resource is null)
    or (action in ('grant', 'suppress') and purpose is not null and resource is not null and
      ((purpose = 'newsletter' and resource = '') or (purpose = 'launch_notice' and resource ~ '^ebook:[a-z0-9-]{1,160}$'))))
);

-- Only trusted server callers may use this RPC. Evidence must be verified by that
-- caller; the supplied source label is not proof of consent. No public caller exists.
create function commerce.record_communication_preference(
  p_request_id uuid, p_email text, p_action text, p_purpose text, p_resource text,
  p_expected_revision bigint, p_source text, p_text_version text, p_evidence_id uuid
) returns jsonb language plpgsql security definer set search_path = pg_catalog, commerce as $$
declare
  normalized text := lower(btrim(p_email));
  fingerprint text;
  prior commerce.communication_preference_events%rowtype;
  contact commerce.communication_contacts%rowtype;
begin
  if p_request_id is null or p_email is null or p_action is null or p_source is null
    or p_text_version is null or p_evidence_id is null
    or (p_expected_revision is not null and p_expected_revision < 0)
    or p_action not in ('grant', 'suppress', 'suppress_all', 'allow_global')
    or p_source not in ('verified_user', 'verified_admin', 'synthetic_test')
    or length(p_text_version) not between 1 and 120 then
    raise exception 'communication_invalid_command';
  end if;
  if (p_action in ('grant', 'suppress') and (p_purpose is null or p_resource is null or not
      ((p_purpose = 'newsletter' and p_resource = '') or (p_purpose = 'launch_notice' and p_resource ~ '^ebook:[a-z0-9-]{1,160}$'))))
    or (p_action in ('suppress_all', 'allow_global') and (p_purpose is not null or p_resource is not null)) then
    raise exception 'communication_invalid_scope';
  end if;
  fingerprint := encode(sha256(convert_to(jsonb_build_array(normalized, p_action, p_purpose, p_resource,
    p_expected_revision, p_source, p_text_version, p_evidence_id)::text, 'UTF8')), 'hex');
  -- Global request identity is locked first, including when two different contacts
  -- receive the same UUID. A collision must fail without changing either contact.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into prior from commerce.communication_preference_events where request_id = p_request_id;
  if found then
    if prior.command_hash <> fingerprint then raise exception 'communication_idempotency_conflict'; end if;
    return jsonb_build_object('outcome', 'replayed', 'revision', prior.revision::text);
  end if;
  insert into commerce.communication_contacts(email) values (normalized) on conflict (email) do nothing;
  select * into strict contact from commerce.communication_contacts where email = normalized for update;
  if p_action in ('grant', 'allow_global') and (p_expected_revision is null or p_expected_revision <> contact.revision) then
    raise exception 'communication_revision_conflict';
  end if;
  if p_action = 'grant' and contact.global_state = 'suppressed' then
    raise exception 'communication_global_suppression';
  end if;
  -- Withdrawal wins regardless of the client's old revision. Replaying any earlier
  -- grant returns its old receipt above and never mutates the current preference.
  update commerce.communication_contacts set revision = revision + 1,
    last_suppressed_revision = case when p_action = 'suppress_all' then revision + 1 else last_suppressed_revision end,
    global_state = case p_action when 'suppress_all' then 'suppressed' when 'allow_global' then 'allowed' else global_state end,
    updated_at = clock_timestamp() where id = contact.id returning * into contact;
  if p_action in ('grant', 'suppress') then
    insert into commerce.communication_preferences(contact_id, purpose, resource, state, revision)
      values (contact.id, p_purpose, p_resource, case p_action when 'grant' then 'granted' else 'suppressed' end, contact.revision)
      on conflict (contact_id, purpose, resource) do update set state = excluded.state, revision = excluded.revision;
  end if;
  insert into commerce.communication_preference_events(request_id, command_hash, contact_id, revision, action, purpose, resource, source, text_version, evidence_id)
    values (p_request_id, fingerprint, contact.id, contact.revision, p_action, p_purpose, p_resource, p_source, p_text_version, p_evidence_id);
  return jsonb_build_object('outcome', 'recorded', 'revision', contact.revision::text);
end;
$$;
revoke all on commerce.communication_contacts, commerce.communication_preferences, commerce.communication_preference_events from public, anon, authenticated;
revoke all on function commerce.record_communication_preference(uuid, text, text, text, text, bigint, text, text, uuid) from public, anon, authenticated;

commit;
