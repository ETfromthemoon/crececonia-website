begin;

drop trigger if exists marketplace_revision_content_immutable on public.marketplace_book_revisions;
drop function if exists public.marketplace_guard_revision_content();

commit;
