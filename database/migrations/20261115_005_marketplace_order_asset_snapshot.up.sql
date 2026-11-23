begin;

-- Capture the exact PDF approved at checkout. A later revision or review must
-- never change the file delivered for an already paid order.
do $$
begin
  if exists (select 1 from public.marketplace_order_items) then
    raise exception 'marketplace asset snapshot migration requires empty order items';
  end if;
end;
$$;

alter table public.marketplace_order_items
  add column pdf_asset_id uuid not null
  references public.marketplace_assets(id) on delete restrict;

commit;
