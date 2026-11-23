begin;

-- Order items and seller settlement depend on the book's original seller.
-- Preserve attribution even before the first publication or sale.
create function public.marketplace_preserve_book_seller() returns trigger
language plpgsql as $$
begin
  if new.seller_id is distinct from old.seller_id then
    raise exception 'marketplace book seller cannot be changed';
  end if;
  return new;
end;
$$;

create trigger marketplace_book_seller_immutable
before update of seller_id on public.marketplace_books
for each row execute function public.marketplace_preserve_book_seller();

commit;
