begin;

create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 140),
  launch_type text not null check (launch_type in ('event','ebook_release','campaign')),
  status text not null default 'draft' check (status in ('draft','planning','ready','published','completed','archived')),
  headline text not null,
  description text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text not null default 'America/Santiago',
  cta_label text not null default 'Quiero participar',
  cta_url text,
  currency text not null default 'CLP' check (currency = 'CLP'),
  start_price_minor integer check (start_price_minor is null or start_price_minor >= 0),
  price_step_minor integer not null default 5000 check (price_step_minor >= 0),
  tier_capacity integer not null default 5 check (tier_capacity > 0),
  source_template text not null default 'workshop-2026-09-06',
  cerneo_required boolean not null default true,
  cerneo_status text not null default 'pending' check (cerneo_status in ('pending','linked','ready')),
  cerneo_project_url text,
  dm_keyword text,
  ad_campaign_name text,
  automation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.launch_products (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  resource text not null,
  title_snapshot text not null,
  role text not null default 'included' check (role in ('primary','included','bonus','upsell')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (launch_id, resource)
);

create table if not exists public.launch_price_tiers (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  label text not null,
  amount_minor integer not null check (amount_minor >= 0),
  capacity integer not null check (capacity > 0),
  sold_count integer not null default 0 check (sold_count >= 0),
  reserved_count integer not null default 0 check (reserved_count >= 0),
  sort_order integer not null,
  status text not null default 'planned' check (status in ('planned','active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (launch_id, sort_order),
  check (sold_count + reserved_count <= capacity)
);
create unique index if not exists launch_price_tiers_one_active on public.launch_price_tiers(launch_id) where status = 'active';

create table if not exists public.launch_tasks (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  category text not null check (category in ('cerneo','publications','dm','ads','automation','delivery','analytics')),
  task_key text not null,
  title text not null,
  instructions text not null,
  required boolean not null default true,
  status text not null default 'pending' check (status in ('pending','ready','blocked','not_applicable')),
  owner text not null default 'CERNEO',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (launch_id, task_key)
);

create table if not exists public.launch_activity (
  id bigint generated always as identity primary key,
  launch_id uuid not null references public.launches(id) on delete cascade,
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists launches_status_starts_idx on public.launches(status, starts_at);
create index if not exists launch_activity_launch_idx on public.launch_activity(launch_id, created_at desc);

commit;
