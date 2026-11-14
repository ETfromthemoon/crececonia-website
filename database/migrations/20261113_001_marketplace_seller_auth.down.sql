begin;
drop function if exists public.marketplace_revise_book_draft(text, uuid, text, text, text, bigint);
drop function if exists public.marketplace_create_book_draft(text, text, text, text, text, bigint);
drop table if exists public.marketplace_seller_tax_profiles;
drop table if exists public.marketplace_seller_login_limits;
drop table if exists public.marketplace_seller_login_challenges;
drop table if exists public.marketplace_seller_identities;
commit;
