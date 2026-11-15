begin;

do $$
begin
  if exists (select 1 from public.marketplace_order_items) then
    raise exception 'marketplace order integrity rollback blocked: order items exist';
  end if;
end;
$$;

drop trigger if exists marketplace_order_items_immutable on public.marketplace_order_items;
drop trigger if exists marketplace_order_pdf_verified on public.marketplace_order_items;
drop trigger if exists marketplace_approved_asset_identity on public.marketplace_assets;
drop function if exists public.marketplace_preserve_approved_asset();
drop function if exists public.marketplace_require_order_pdf();
alter table public.marketplace_order_items drop constraint if exists marketplace_order_items_pdf_revision_book_fk;
alter table public.marketplace_assets drop constraint if exists marketplace_assets_id_revision_book_unique;

commit;
