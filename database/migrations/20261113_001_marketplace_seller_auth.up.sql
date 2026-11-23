begin;

create table public.marketplace_seller_identities (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and char_length(email) between 3 and 320),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table public.marketplace_seller_login_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(trim(email)) and char_length(email) between 3 and 320),
  token_hash char(64) not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  ip_hash char(64) not null check (ip_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index marketplace_seller_challenges_email_recent_idx
  on public.marketplace_seller_login_challenges (email, created_at desc);
create index marketplace_seller_challenges_ip_recent_idx
  on public.marketplace_seller_login_challenges (ip_hash, created_at desc);

create table public.marketplace_seller_login_limits (
  key_hash char(64) not null check (key_hash ~ '^[a-f0-9]{64}$'),
  hour_start timestamptz not null,
  attempts integer not null check (attempts between 1 and 20),
  primary key (key_hash, hour_start)
);

create table public.marketplace_seller_tax_profiles (
  seller_id uuid primary key references public.marketplace_sellers(id) on delete restrict,
  rut text not null unique check (rut ~ '^[0-9]{7,8}-[0-9K]$'),
  legal_name text not null check (char_length(legal_name) between 3 and 160),
  declared_vat_status text not null check (declared_vat_status in ('vat_registered','not_registered','unsure')),
  review_status text not null default 'pending' check (review_status in ('pending','verified','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((reviewed_by is null) = (reviewed_at is null)),
  check (review_status = 'pending' or reviewed_by is not null)
);

-- A draft, its first revision and the audit record must either all exist or none exist.
create function public.marketplace_create_book_draft(
  p_owner_user_id text, p_slug text, p_title text, p_description text,
  p_category text, p_price_minor bigint
) returns uuid language plpgsql as $$
declare
  v_seller_id uuid;
  v_author_name text;
  v_book_id uuid;
  v_revision_id uuid;
begin
  select id, display_name into v_seller_id, v_author_name
  from public.marketplace_sellers
  where owner_user_id = p_owner_user_id and status in ('draft', 'pending_verification', 'active');
  if v_seller_id is null then raise exception 'seller not eligible'; end if;

  insert into public.marketplace_books (seller_id, slug)
  values (v_seller_id, p_slug) returning id into v_book_id;
  insert into public.marketplace_book_revisions
    (book_id, revision_number, title, description, author_display_name, category,
     price_minor, rights_declaration_version, rights_declared_at)
  values
    (v_book_id, 1, p_title, p_description, v_author_name, p_category,
     p_price_minor, 'marketplace-rights-v1', now()) returning id into v_revision_id;
  update public.marketplace_books set current_revision_id = v_revision_id, updated_at = now()
  where id = v_book_id;
  insert into public.marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
  values (p_owner_user_id, 'book_draft_created', 'book', v_book_id);
  return v_book_id;
end;
$$;

create function public.marketplace_revise_book_draft(
  p_owner_user_id text, p_book_id uuid, p_title text, p_description text,
  p_category text, p_price_minor bigint
) returns uuid language plpgsql as $$
declare
  v_seller_id uuid;
  v_author_name text;
  v_revision_number integer;
  v_revision_id uuid;
begin
  select s.id, s.display_name into v_seller_id, v_author_name
  from public.marketplace_books b
  join public.marketplace_sellers s on s.id = b.seller_id
  where b.id = p_book_id and b.status = 'changes_requested'
    and s.owner_user_id = p_owner_user_id and s.status in ('pending_verification', 'active')
  for update of b;
  if v_seller_id is null then raise exception 'book not revisable'; end if;

  select coalesce(max(revision_number), 0) + 1 into v_revision_number
  from public.marketplace_book_revisions where book_id = p_book_id;
  insert into public.marketplace_book_revisions
    (book_id, revision_number, title, description, author_display_name, category,
     price_minor, rights_declaration_version, rights_declared_at)
  values
    (p_book_id, v_revision_number, p_title, p_description, v_author_name, p_category,
     p_price_minor, 'marketplace-rights-v1', now()) returning id into v_revision_id;
  update public.marketplace_books
  set current_revision_id = v_revision_id, status = 'draft', updated_at = now()
  where id = p_book_id;
  insert into public.marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
  values (p_owner_user_id, 'book_revision_created', 'book', p_book_id);
  return v_revision_id;
end;
$$;

commit;
