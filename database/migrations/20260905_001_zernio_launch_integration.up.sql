begin;

alter table public.launches add column zernio_required boolean not null default true;
alter table public.launches add column zernio_status text not null default 'pending' constraint launches_zernio_status_check check (zernio_status in ('pending','connected','error','ready'));
alter table public.launches add column zernio_profile_id text;
alter table public.launches add column zernio_accounts jsonb not null default '[]'::jsonb;
alter table public.launches add column zernio_last_synced_at timestamptz;
alter table public.launches add column zernio_sync_error text;

alter table public.launch_tasks drop constraint if exists launch_tasks_category_check;
alter table public.launch_tasks add constraint launch_tasks_category_check check (category in ('zernio','cerneo','publications','dm','ads','automation','delivery','analytics'));
alter table public.launch_tasks alter column owner set default 'Zernio';

create table public.launch_publications (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 180),
  content text not null check (char_length(content) between 1 and 10000),
  targets jsonb not null check (jsonb_typeof(targets) = 'array'),
  status text not null default 'draft' check (status in ('draft','synced','published','failed')),
  zernio_post_id text,
  zernio_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.launch_dm_automations (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  name text not null,
  account_id text not null,
  platform text not null check (platform in ('instagram','facebook')),
  keyword text not null,
  dm_message text not null check (char_length(dm_message) between 1 and 1000),
  comment_reply text,
  status text not null default 'creating' check (status in ('creating','active','paused','failed')),
  zernio_automation_id text,
  zernio_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index launch_publications_launch_idx on public.launch_publications(launch_id, created_at desc);
create index launch_dm_automations_launch_idx on public.launch_dm_automations(launch_id, created_at desc);

commit;
