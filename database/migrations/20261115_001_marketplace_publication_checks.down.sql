begin;

-- Keep verification evidence while any decision exists. A rollback must be
-- explicit about its audit-data loss instead of silently dropping records.
do $$
begin
  if exists (select 1 from public.marketplace_publication_checks) then
    raise exception 'cannot roll back marketplace publication checks with verification records';
  end if;
end;
$$;

drop trigger if exists marketplace_publication_requires_check on public.marketplace_books;
drop function if exists public.marketplace_require_publication_check();
drop trigger if exists marketplace_publication_checks_immutable on public.marketplace_publication_checks;
drop table if exists public.marketplace_publication_checks;

commit;
