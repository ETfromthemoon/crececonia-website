begin;

-- Marketplace foundation only. No rows, payment provider, or checkout are activated.
-- Identity is an opaque application user id until the auth provider is selected.
create table public.marketplace_sellers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id text not null unique check (char_length(owner_user_id) between 1 and 200),
  public_slug text not null unique check (public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text not null check (char_length(display_name) between 2 and 120),
  bio text not null default '' check (char_length(bio) <= 2000),
  status text not null default 'draft' check (status in ('draft','pending_verification','active','rejected','suspended')),
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((terms_version is null) = (terms_accepted_at is null))
);

create table public.marketplace_books (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers(id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft','in_review','changes_requested','approved','published','paused','archived')),
  current_revision_id uuid,
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique (id, seller_id)
);

create table public.marketplace_book_revisions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.marketplace_books(id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  title text not null check (char_length(title) between 3 and 180),
  subtitle text not null default '' check (char_length(subtitle) <= 240),
  description text not null check (char_length(description) between 20 and 10000),
  author_display_name text not null check (char_length(author_display_name) between 2 and 120),
  category text not null check (category in ('ia','tecnologia','negocios')),
  language text not null default 'es-CL' check (language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  price_minor bigint not null check (price_minor > 0),
  price_tax_mode text not null default 'pending_review' check (price_tax_mode in ('pending_review','tax_inclusive','exempt','not_applicable')),
  rights_declaration_version text,
  rights_declared_at timestamptz,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','changes_requested','rejected')),
  moderation_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (book_id, revision_number),
  unique (id, book_id),
  check ((rights_declaration_version is null) = (rights_declared_at is null)),
  check ((moderation_status = 'pending') or (reviewed_by is not null and reviewed_at is not null))
);

alter table public.marketplace_books
  add constraint marketplace_books_current_revision_fk
  foreign key (current_revision_id, id) references public.marketplace_book_revisions(id, book_id) on delete restrict;
alter table public.marketplace_books
  add constraint marketplace_books_published_revision_fk
  foreign key (published_revision_id, id) references public.marketplace_book_revisions(id, book_id) on delete restrict;

create table public.marketplace_assets (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.marketplace_books(id) on delete restrict,
  revision_id uuid not null,
  asset_kind text not null check (asset_kind in ('ebook_pdf','cover','sample')),
  storage_key text not null unique check (storage_key !~ '(^/|\\.\\.|\\\\)'),
  content_type text not null,
  byte_size bigint not null check (byte_size > 0),
  sha256 char(64) not null check (sha256 ~ '^[a-f0-9]{64}$'),
  scan_status text not null default 'quarantined' check (scan_status in ('quarantined','scanning','ready','rejected')),
  created_at timestamptz not null default now(),
  foreign key (revision_id, book_id) references public.marketplace_book_revisions(id, book_id) on delete restrict
);

create table public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_email text not null check (char_length(buyer_email) between 3 and 320),
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','partially_refunded','refunded','disputed','review_required')),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 200),
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  total_minor bigint not null check (total_minor > 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  check (subtotal_minor <= total_minor)
);

create table public.marketplace_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete restrict,
  book_id uuid not null,
  revision_id uuid not null,
  seller_id uuid not null references public.marketplace_sellers(id) on delete restrict,
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  quantity smallint not null default 1 check (quantity = 1),
  price_minor bigint not null check (price_minor > 0),
  tax_mode text not null check (tax_mode in ('pending_review','tax_inclusive','exempt','not_applicable')),
  tax_rate_bps integer not null check (tax_rate_bps between 0 and 10000),
  tax_minor bigint not null check (tax_minor >= 0),
  commission_rate_bps integer not null default 500 check (commission_rate_bps between 0 and 10000),
  commission_basis_minor bigint not null check (commission_basis_minor >= 0),
  commission_minor bigint not null check (commission_minor >= 0),
  commission_tax_minor bigint not null default 0 check (commission_tax_minor >= 0),
  gateway_fee_estimate_minor bigint check (gateway_fee_estimate_minor is null or gateway_fee_estimate_minor >= 0),
  created_at timestamptz not null default now(),
  foreign key (revision_id, book_id) references public.marketplace_book_revisions(id, book_id) on delete restrict,
  foreign key (book_id, seller_id) references public.marketplace_books(id, seller_id) on delete restrict,
  unique (order_id, book_id)
);

create table public.marketplace_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete restrict,
  provider text not null check (char_length(provider) between 2 and 80),
  provider_account_ref text not null,
  provider_payment_ref text not null,
  attempt_number smallint not null check (attempt_number > 0),
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  amount_minor bigint not null check (amount_minor > 0),
  gateway_fee_actual_minor bigint check (gateway_fee_actual_minor is null or gateway_fee_actual_minor >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','failed','cancelled','refunded','disputed','review_required')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_ref),
  unique (order_id, attempt_number)
);

create table public.marketplace_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.marketplace_payments(id) on delete restrict,
  provider text not null,
  provider_event_ref text not null,
  event_type text not null,
  payload_digest char(64) not null check (payload_digest ~ '^[a-f0-9]{64}$'),
  processing_status text not null default 'received' check (processing_status in ('received','processed','ignored','failed')),
  error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_ref)
);

create table public.marketplace_entitlements (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null unique references public.marketplace_order_items(id) on delete restrict,
  buyer_email text not null check (char_length(buyer_email) between 3 and 320),
  book_id uuid not null references public.marketplace_books(id) on delete restrict,
  status text not null default 'active' check (status in ('active','revoked','review_required')),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  check ((status = 'revoked') = (revoked_at is not null))
);

create table public.marketplace_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null,
  order_id uuid references public.marketplace_orders(id) on delete restrict,
  order_item_id uuid references public.marketplace_order_items(id) on delete restrict,
  payment_id uuid references public.marketplace_payments(id) on delete restrict,
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  account_code text not null check (account_code in ('processor_clearing','seller_payable','platform_commission','tax_payable','gateway_fee','refunds_payable','adjustment')),
  debit_minor bigint not null default 0 check (debit_minor >= 0),
  credit_minor bigint not null default 0 check (credit_minor >= 0),
  source_type text not null,
  source_ref text not null,
  created_at timestamptz not null default now(),
  unique (journal_id, account_code, source_type, source_ref),
  check ((debit_minor > 0 and credit_minor = 0) or (credit_minor > 0 and debit_minor = 0)),
  check (order_id is not null or payment_id is not null)
);

create table public.marketplace_refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.marketplace_payments(id) on delete restrict,
  provider_refund_ref text unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  reason_code text not null,
  status text not null default 'requested' check (status in ('requested','processing','succeeded','failed')),
  requested_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.marketplace_settlements (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.marketplace_sellers(id) on delete restrict,
  provider text not null,
  provider_settlement_ref text not null,
  currency char(3) not null default 'CLP' check (currency = 'CLP'),
  gross_minor bigint not null check (gross_minor >= 0),
  fees_minor bigint not null check (fees_minor >= 0),
  net_minor bigint not null check (net_minor >= 0),
  status text not null default 'pending' check (status in ('pending','paid','failed','reconciled','review_required')),
  occurred_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_settlement_ref),
  check (gross_minor >= fees_minor),
  check (net_minor = gross_minor - fees_minor)
);

create table public.marketplace_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','succeeded','failed','dead_letter')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  lease_until timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.marketplace_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index marketplace_sellers_status_idx on public.marketplace_sellers(status, created_at);
create index marketplace_books_seller_status_idx on public.marketplace_books(seller_id, status, updated_at desc);
create index marketplace_book_revisions_moderation_idx on public.marketplace_book_revisions(moderation_status, created_at);
create index marketplace_assets_revision_status_idx on public.marketplace_assets(revision_id, scan_status);
create index marketplace_orders_status_created_idx on public.marketplace_orders(status, created_at);
create index marketplace_order_items_seller_created_idx on public.marketplace_order_items(seller_id, created_at);
create index marketplace_payments_order_status_idx on public.marketplace_payments(order_id, status);
create index marketplace_payment_events_processing_idx on public.marketplace_payment_events(processing_status, received_at);
create index marketplace_ledger_order_idx on public.marketplace_ledger_entries(order_id, created_at);
create index marketplace_ledger_payment_idx on public.marketplace_ledger_entries(payment_id, created_at);
create index marketplace_refunds_payment_status_idx on public.marketplace_refunds(payment_id, status);
create index marketplace_settlements_seller_time_idx on public.marketplace_settlements(seller_id, occurred_at desc);
create index marketplace_outbox_ready_idx on public.marketplace_outbox(available_at) where status in ('pending','processing');
create index marketplace_audit_entity_idx on public.marketplace_audit_log(entity_type, entity_id, created_at desc);

-- Accounting evidence and webhook/audit records are append-only. State transitions
-- belong in their owning entities and are performed only by server-side domain code.
create function public.marketplace_reject_immutable_mutation() returns trigger
language plpgsql as $$
begin
  raise exception 'marketplace table % is append-only', tg_table_name;
end;
$$;

create trigger marketplace_ledger_immutable
before update or delete on public.marketplace_ledger_entries
for each row execute function public.marketplace_reject_immutable_mutation();
create trigger marketplace_audit_immutable
before update or delete on public.marketplace_audit_log
for each row execute function public.marketplace_reject_immutable_mutation();

commit;
