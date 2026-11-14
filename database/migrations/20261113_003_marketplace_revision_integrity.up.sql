begin;

-- Editorial decisions may change, but the seller-authored content of a revision
-- is a historical record once inserted. Editing creates another revision.
create function public.marketplace_guard_revision_content() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'marketplace book revisions cannot be deleted';
  end if;
  if row(new.id, new.book_id, new.revision_number, new.title, new.subtitle,
         new.description, new.author_display_name, new.category, new.language,
         new.currency, new.price_minor, new.rights_declaration_version,
         new.rights_declared_at, new.created_at)
     is distinct from
     row(old.id, old.book_id, old.revision_number, old.title, old.subtitle,
         old.description, old.author_display_name, old.category, old.language,
         old.currency, old.price_minor, old.rights_declaration_version,
         old.rights_declared_at, old.created_at) then
    raise exception 'marketplace book revision content cannot be changed';
  end if;
  if old.price_tax_mode <> 'pending_review'
     and new.price_tax_mode is distinct from old.price_tax_mode then
    raise exception 'marketplace book revision tax mode is final';
  end if;
  return new;
end;
$$;

create trigger marketplace_revision_content_immutable
before update or delete on public.marketplace_book_revisions
for each row execute function public.marketplace_guard_revision_content();

commit;
