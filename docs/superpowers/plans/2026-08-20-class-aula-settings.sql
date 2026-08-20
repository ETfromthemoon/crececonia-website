-- Configuración operable desde /admin/clase. Las variables de entorno siguen
-- siendo respaldo para no interrumpir los correos ni el checkout existentes.

create table if not exists commerce.class_aula_settings (
  product_key text primary key,
  session_url text,
  whatsapp_group_url text,
  recording_url text,
  support_email text,
  classroom_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table commerce.class_aula_settings enable row level security;

revoke all on table commerce.class_aula_settings from public, anon, authenticated;
grant select, insert, update on table commerce.class_aula_settings to service_role;

insert into commerce.class_aula_settings (
  product_key,
  session_url,
  whatsapp_group_url,
  recording_url,
  support_email
)
values ('clase:clase-en-vivo-2026-08-23', null, null, null, 'sergio@crececonia.cl')
on conflict (product_key) do nothing;
