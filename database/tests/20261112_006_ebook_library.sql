begin;
\ir ../migrations/20261112_006_ebook_library.up.sql
do $$ begin
  if to_regclass('commerce.ebook_library_challenges') is null or to_regclass('commerce.ebook_library_sessions') is null or to_regclass('commerce.ebook_library_rate_limits') is null then raise exception 'library tables missing'; end if;
  if has_table_privilege('anon','commerce.ebook_library_challenges','select,insert,update,delete') or has_table_privilege('authenticated','commerce.ebook_library_challenges','select,insert,update,delete') then raise exception 'public role can access challenges'; end if;
  if has_table_privilege('anon','commerce.ebook_library_sessions','select,insert,update,delete') or has_table_privilege('authenticated','commerce.ebook_library_sessions','select,insert,update,delete') then raise exception 'public role can access sessions'; end if;
  if has_table_privilege('anon','commerce.ebook_library_rate_limits','select,insert,update,delete') or has_table_privilege('authenticated','commerce.ebook_library_rate_limits','select,insert,update,delete') then raise exception 'public role can access rate limits'; end if;
  if has_function_privilege('anon','commerce.reserve_ebook_library_request(text,text)','execute') or has_function_privilege('authenticated','commerce.reserve_ebook_library_request(text,text)','execute') then raise exception 'public role can reserve requests'; end if;
  if has_function_privilege('anon','commerce.consume_ebook_library_challenge(text,text)','execute') or has_function_privilege('authenticated','commerce.consume_ebook_library_challenge(text,text)','execute') then raise exception 'public role can consume challenge'; end if;
  if has_function_privilege('anon','commerce.revoke_ebook_library_session(text)','execute') or has_function_privilege('authenticated','commerce.revoke_ebook_library_session(text)','execute') then raise exception 'public role can revoke session'; end if;
  if not exists (select 1 from pg_indexes where schemaname='commerce' and indexname='ebook_library_sessions_challenge_idx') then raise exception 'session challenge index missing'; end if;
end $$;
do $$
declare email_key text := repeat('a',64); ip_key text := repeat('b',64); challenge_id uuid; expiry timestamptz;
begin
  if not commerce.reserve_ebook_library_request(email_key,ip_key) or not commerce.reserve_ebook_library_request(email_key,ip_key) or not commerce.reserve_ebook_library_request(email_key,ip_key) then raise exception 'allowed request rejected before hourly limit'; end if;
  if commerce.reserve_ebook_library_request(email_key,ip_key) then raise exception 'hourly email limit not enforced'; end if;
  insert into commerce.ebook_library_challenges(token_hash,email,expires_at) values (repeat('c',64),'buyer@example.com',now()+interval '1 hour') returning id into challenge_id;
  expiry := commerce.consume_ebook_library_challenge(repeat('c',64),repeat('d',64));
  if expiry is null or expiry <= now() then raise exception 'valid challenge not consumed'; end if;
  if commerce.consume_ebook_library_challenge(repeat('c',64),repeat('e',64)) is not null then raise exception 'challenge replay accepted'; end if;
  if not commerce.revoke_ebook_library_session(repeat('d',64)) then raise exception 'session revocation failed'; end if;
  if commerce.revoke_ebook_library_session(repeat('d',64)) then raise exception 'session revoked twice'; end if;
end $$;
rollback;
