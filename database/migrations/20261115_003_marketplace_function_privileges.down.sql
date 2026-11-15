begin;

grant execute on function public.marketplace_create_book_draft(text, text, text, text, text, bigint) to public;
grant execute on function public.marketplace_revise_book_draft(text, uuid, text, text, text, bigint) to public;
grant execute on function public.marketplace_edit_book_draft(text, uuid, text, text, text, bigint) to public;

commit;
