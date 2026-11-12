create table commerce.service_qualifications (
  id uuid primary key,
  service text not null check (service in ('mentoria', 'implementacion')),
  email text not null,
  payload jsonb not null,
  payload_hash text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')),
  created_at timestamptz not null default now()
);
create index service_qualifications_status_created_idx on commerce.service_qualifications (status, created_at);
