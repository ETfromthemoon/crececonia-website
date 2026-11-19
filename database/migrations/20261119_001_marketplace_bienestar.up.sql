begin;

alter table public.marketplace_book_revisions
  add constraint marketplace_book_revisions_category_extended_check
  check (category in ('ia', 'tecnologia', 'negocios', 'bienestar'));

alter table public.marketplace_book_revisions
  drop constraint marketplace_book_revisions_category_check;

alter table public.marketplace_book_revisions
  rename constraint marketplace_book_revisions_category_extended_check
  to marketplace_book_revisions_category_check;

commit;
