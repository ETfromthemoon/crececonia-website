begin;
-- Hold these locks through the emptiness check so registrations cannot race the drop.
lock table public.marketplace_sellers,
  public.marketplace_seller_tax_profiles,
  public.marketplace_seller_login_limits,
  public.marketplace_seller_login_challenges,
  public.marketplace_seller_identities in access exclusive mode;
do $$
begin
  if exists (select 1 from public.marketplace_sellers where owner_user_id is not null)
    or exists (select 1 from public.marketplace_seller_tax_profiles)
    or exists (select 1 from public.marketplace_seller_login_limits)
    or exists (select 1 from public.marketplace_seller_login_challenges)
    or exists (select 1 from public.marketplace_seller_identities) then
    raise exception 'marketplace seller auth rollback refused: seller or login evidence exists';
  end if;
end $$;
drop function if exists public.marketplace_revise_book_draft(text, uuid, text, text, text, bigint);
drop function if exists public.marketplace_create_book_draft(text, text, text, text, text, bigint);
drop table if exists public.marketplace_seller_tax_profiles;
drop table if exists public.marketplace_seller_login_limits;
drop table if exists public.marketplace_seller_login_challenges;
drop table if exists public.marketplace_seller_identities;
commit;
