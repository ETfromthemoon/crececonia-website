begin;
\ir ../migrations/20261112_006_ebook_library.up.sql
do $$ begin
  if to_regclass('commerce.ebook_library_challenges') is null or to_regclass('commerce.ebook_library_sessions') is null or to_regclass('commerce.ebook_library_rate_limits') is null then raise exception 'library tables missing'; end if;
  if has_function_privilege('anon','commerce.consume_ebook_library_challenge(text,text)','execute') then raise exception 'anon can consume challenge'; end if;
  if has_function_privilege('authenticated','commerce.consume_ebook_library_challenge(text,text)','execute') then raise exception 'authenticated can consume challenge'; end if;
end $$;
rollback;
