begin;

lock table commerce.discount_codes in access exclusive mode;
do $$
begin
  if exists (select 1 from commerce.discount_codes where resource is not null) then
    raise exception 'Cannot remove discount scope while scoped codes exist';
  end if;
end $$;

-- PostgreSQL cannot remove a view column with CREATE OR REPLACE VIEW.
drop view public.discount_codes;
alter table commerce.discount_codes drop constraint discount_codes_resource_format;
alter table commerce.discount_codes drop column resource;
create view public.discount_codes with (security_invoker = true) as
  select id, code, type, amount, max_uses, used_count, expires_at,
         created_at, active
    from commerce.discount_codes;

commit;
