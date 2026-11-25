begin;

create table commerce.ebook_edition_notices (
  edition_id text not null,
  email text not null,
  manifest_sha256 text not null,
  status text not null check (status in ('sending', 'accepted', 'review')),
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (edition_id, email),
  constraint edition_id_format check (edition_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

commit;
