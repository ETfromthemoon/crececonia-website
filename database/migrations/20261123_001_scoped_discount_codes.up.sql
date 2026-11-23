begin;

alter table commerce.discount_codes
  add column resource text;

alter table commerce.discount_codes
  add constraint discount_codes_resource_format
  check (resource is null or resource ~ '^ebook:[a-z0-9]+(-[a-z0-9]+)*$');

-- Preserve the existing column order so older consumers keep their contract.
create or replace view public.discount_codes with (security_invoker = true) as
  select id, code, type, amount, max_uses, used_count, expires_at,
         created_at, active, resource
    from commerce.discount_codes;

commit;
