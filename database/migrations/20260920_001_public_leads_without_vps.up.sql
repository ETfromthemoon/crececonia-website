create schema if not exists commerce;

create table if not exists commerce.public_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  resource text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, resource)
);

create table if not exists commerce.evaluations (
  id uuid primary key default gen_random_uuid(),
  scheduling_token uuid not null default gen_random_uuid() unique,
  nombre text not null,
  email text not null,
  empresa text not null,
  empresa_descripcion text not null,
  tamano_equipo text not null,
  rol text not null,
  proceso_pain text not null,
  uso_ia_actual text not null,
  resultado_esperado text not null,
  horizonte_decision text not null,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists commerce.call_requests (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null references commerce.evaluations(id),
  preferred_times jsonb not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists public_subscribers_created_at_idx
  on commerce.public_subscribers (created_at desc);
create index if not exists evaluations_created_at_idx
  on commerce.evaluations (created_at desc);
create index if not exists call_requests_evaluation_id_idx
  on commerce.call_requests (evaluation_id, created_at desc);
