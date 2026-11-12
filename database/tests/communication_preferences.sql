-- Only run after migration 005 on an explicitly selected disposable test branch.
-- Always rollback synthetic identities. Concurrency needs two sessions (see docs).
begin;
do $$
declare
  v_email text := 'preferences-' || gen_random_uuid()::text || '@example.invalid';
  request uuid := gen_random_uuid();
  evidence uuid := gen_random_uuid();
  result jsonb;
  contact uuid;
  n bigint;
begin
  result := commerce.record_communication_preference(request, v_email, 'grant', 'newsletter', '', 0, 'synthetic_test', 'test-v1', evidence);
  if result->>'revision' <> '1' then raise exception 'initial revision failed'; end if;
  select id into strict contact from commerce.communication_contacts c where c.email = v_email;
  perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'suppress_all', null, null, 0, 'synthetic_test', 'test-v1', evidence);
  result := commerce.record_communication_preference(request, v_email, 'grant', 'newsletter', '', 0, 'synthetic_test', 'test-v1', evidence);
  if result->>'outcome' <> 'replayed' or result->>'revision' <> '1' then raise exception 'receipt replay failed'; end if;
  if (select global_state from commerce.communication_contacts where id = contact) <> 'suppressed' then raise exception 'replay revived consent'; end if;
  begin
    perform commerce.record_communication_preference(request, 'other-' || v_email, 'grant', 'newsletter', '', 0, 'synthetic_test', 'test-v1', evidence);
    raise exception 'different payload accepted';
  exception when others then
    if sqlerrm <> 'communication_idempotency_conflict' then raise; end if;
  end;
  if exists (select 1 from commerce.communication_contacts c where c.email = 'other-' || v_email) then raise exception 'conflict mutated contact'; end if;
  begin
    perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'grant', 'newsletter', '', 0, 'synthetic_test', 'test-v1', evidence);
    raise exception 'stale grant accepted';
  exception when others then
    if sqlerrm <> 'communication_revision_conflict' then raise; end if;
  end;
  begin
    perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'grant', 'newsletter', '', 2, 'synthetic_test', 'test-v1', evidence);
    raise exception 'grant during global suppression accepted';
  exception when others then
    if sqlerrm <> 'communication_global_suppression' then raise; end if;
  end;
  perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'allow_global', null, null, 2, 'synthetic_test', 'test-v1', evidence);
  select count(*) into n from commerce.communication_preferences p join commerce.communication_contacts c on c.id = p.contact_id
    where c.id = contact and c.global_state <> 'suppressed' and p.state = 'granted' and p.revision > c.last_suppressed_revision;
  if n <> 0 then raise exception 'lifting global suppression revived old scoped grant'; end if;
  perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'grant', 'launch_notice', 'ebook:synthetic-book', 3, 'synthetic_test', 'test-v1', evidence);
  select count(*) into n from commerce.communication_preferences p join commerce.communication_contacts c on c.id = p.contact_id
    where c.id = contact and p.purpose = 'newsletter' and p.state = 'granted' and p.revision > c.last_suppressed_revision;
  if n <> 0 then raise exception 'launch grant authorized newsletter'; end if;
  perform commerce.record_communication_preference(gen_random_uuid(), v_email, 'suppress', 'launch_notice', 'ebook:synthetic-book', 0, 'synthetic_test', 'test-v1', evidence);
  if (select count(*) from commerce.communication_preference_events where contact_id = contact) <> 5 then raise exception 'history/replay count mismatch'; end if;
  if exists (select 1 from unnest(array['anon','authenticated']) r where has_function_privilege(r, 'commerce.record_communication_preference(uuid,text,text,text,text,bigint,text,text,uuid)', 'EXECUTE')) then raise exception 'untrusted function access'; end if;
  if exists (select 1 from unnest(array['anon','authenticated']) r where has_table_privilege(r, 'commerce.communication_contacts', 'INSERT,UPDATE,DELETE')) then raise exception 'untrusted state mutation'; end if;
end;
$$;
rollback;
