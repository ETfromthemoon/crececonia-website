begin;

-- The application connects as the function owner. Seller RPCs must not be
-- callable by every role that might receive database access later.
revoke execute on function public.marketplace_create_book_draft(text, text, text, text, text, bigint) from public;
revoke execute on function public.marketplace_revise_book_draft(text, uuid, text, text, text, bigint) from public;
revoke execute on function public.marketplace_edit_book_draft(text, uuid, text, text, text, bigint) from public;

commit;
