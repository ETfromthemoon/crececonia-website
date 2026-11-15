begin;

-- A final, revision-scoped human check is required after editorial approval.
-- The asset IDs make the decision refer to the exact files that were reviewed.
create table public.marketplace_publication_checks (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null,
  revision_id uuid not null,
  pdf_asset_id uuid not null references public.marketplace_assets(id) on delete restrict,
  cover_asset_id uuid not null references public.marketplace_assets(id) on delete restrict,
  identity_confirmed boolean not null check (identity_confirmed),
  tax_confirmed boolean not null check (tax_confirmed),
  rights_confirmed boolean not null check (rights_confirmed),
  pdf_confirmed boolean not null check (pdf_confirmed),
  cover_confirmed boolean not null check (cover_confirmed),
  evidence_note text not null check (char_length(btrim(evidence_note)) between 20 and 2000),
  verified_by text not null check (char_length(verified_by) between 1 and 200),
  verified_at timestamptz not null default now(),
  foreign key (revision_id, book_id)
    references public.marketplace_book_revisions(id, book_id) on delete restrict
);

create index marketplace_publication_checks_revision_idx
  on public.marketplace_publication_checks(book_id, revision_id, verified_at desc);

create trigger marketplace_publication_checks_immutable
before update or delete on public.marketplace_publication_checks
for each row execute function public.marketplace_reject_immutable_mutation();

-- Also guard direct updates outside the admin route. A book can become public
-- only with a current, verified decision for the exact approved assets.
create function public.marketplace_require_publication_check() returns trigger
language plpgsql as $$
begin
  if new.status <> 'published' then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status = 'published'
       and new.published_revision_id is not distinct from old.published_revision_id then
      return new;
    end if;
  end if;
  if new.current_revision_id is distinct from new.published_revision_id
     or not exists (
       select 1
       from public.marketplace_publication_checks v
       join public.marketplace_book_revisions r
         on r.id = v.revision_id and r.book_id = new.id
       join public.marketplace_sellers s on s.id = new.seller_id
       join public.marketplace_seller_tax_profiles t on t.seller_id = s.id
       join public.marketplace_assets pdf on pdf.id = v.pdf_asset_id
       join public.marketplace_assets cover on cover.id = v.cover_asset_id
       where v.book_id = new.id and v.revision_id = new.published_revision_id
         and r.moderation_status = 'approved'
         and v.verified_at >= greatest(r.reviewed_at, t.reviewed_at)
         and s.status = 'active' and s.terms_accepted_at is not null
         and t.review_status = 'verified'
         and r.rights_declared_at is not null
         and r.price_tax_mode in ('tax_inclusive', 'exempt')
         and pdf.book_id = new.id and pdf.revision_id = r.id
         and pdf.asset_kind = 'ebook_pdf' and pdf.scan_status = 'ready'
         and cover.book_id = new.id and cover.revision_id = r.id
         and cover.asset_kind = 'cover' and cover.scan_status = 'ready'
     ) then
    raise exception 'marketplace publication requires a current verified review';
  end if;
  return new;
end;
$$;

create trigger marketplace_publication_requires_check
before insert or update of status, published_revision_id on public.marketplace_books
for each row execute function public.marketplace_require_publication_check();

commit;
