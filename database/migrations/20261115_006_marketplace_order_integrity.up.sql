begin;

-- A paid order's book, seller, price and PDF are accounting snapshots.
alter table public.marketplace_assets
  add constraint marketplace_assets_id_revision_book_unique
  unique (id, revision_id, book_id);

alter table public.marketplace_order_items
  add constraint marketplace_order_items_pdf_revision_book_fk
  foreign key (pdf_asset_id, revision_id, book_id)
  references public.marketplace_assets(id, revision_id, book_id) on delete restrict;

create function public.marketplace_require_order_pdf() returns trigger
language plpgsql as $$
begin
  if not exists (
    select 1 from public.marketplace_assets a
    join public.marketplace_publication_checks v
      on v.pdf_asset_id = a.id and v.revision_id = a.revision_id
      and v.book_id = a.book_id
    where a.id = new.pdf_asset_id and a.revision_id = new.revision_id
      and a.book_id = new.book_id and a.asset_kind = 'ebook_pdf'
      and a.scan_status = 'ready'
  ) then
    raise exception 'marketplace order requires the approved PDF asset';
  end if;
  return new;
end;
$$;

-- Once a file has been approved or sold, its delivery identity cannot change.
create function public.marketplace_preserve_approved_asset() returns trigger
language plpgsql as $$
begin
  if exists (
    select 1 from public.marketplace_publication_checks v
    where v.pdf_asset_id = old.id or v.cover_asset_id = old.id
  ) or exists (
    select 1 from public.marketplace_order_items i where i.pdf_asset_id = old.id
  ) then
    if tg_op = 'DELETE' then
      raise exception 'marketplace approved asset cannot be deleted';
    end if;
    if (new.book_id, new.revision_id, new.asset_kind, new.storage_key, new.sha256)
       is distinct from
       (old.book_id, old.revision_id, old.asset_kind, old.storage_key, old.sha256) then
      raise exception 'marketplace approved asset identity cannot be changed';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger marketplace_approved_asset_identity
before update or delete on public.marketplace_assets
for each row execute function public.marketplace_preserve_approved_asset();

create trigger marketplace_order_pdf_verified
before insert on public.marketplace_order_items
for each row execute function public.marketplace_require_order_pdf();

create trigger marketplace_order_items_immutable
before update or delete on public.marketplace_order_items
for each row execute function public.marketplace_reject_immutable_mutation();

commit;
