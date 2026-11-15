begin;

do $$
begin
  if exists (select 1 from public.marketplace_order_items) then
    raise exception 'marketplace asset snapshot rollback blocked: order items exist';
  end if;
end;
$$;

alter table public.marketplace_order_items drop column pdf_asset_id;

commit;
