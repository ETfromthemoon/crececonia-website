begin;

-- The new check fails before changing the existing constraint if books use bienestar.
alter table public.marketplace_book_revisions
  add constraint marketplace_book_revisions_category_previous_check
  check (category in ('ia', 'tecnologia', 'negocios'));

alter table public.marketplace_book_revisions
  drop constraint marketplace_book_revisions_category_check;

alter table public.marketplace_book_revisions
  rename constraint marketplace_book_revisions_category_previous_check
  to marketplace_book_revisions_category_check;

commit;
