begin;
do $$ begin
  if exists (select 1 from public.marketplace_orders where request_digest is not null or flow_checkout_url is not null) then
    raise exception 'checkout claim data exists; refusing to remove replay columns';
  end if;
end $$;
drop function if exists public.claim_marketplace_checkout(uuid,uuid,char(64),text,uuid,uuid,uuid,text,bigint,text,integer,bigint,integer);
drop index if exists public.marketplace_orders_buyer_created_idx;
alter table public.marketplace_orders drop column if exists flow_checkout_url, drop column if exists request_digest;
commit;
