begin;

drop trigger if exists marketplace_book_seller_immutable on public.marketplace_books;
drop function if exists public.marketplace_preserve_book_seller();

commit;
