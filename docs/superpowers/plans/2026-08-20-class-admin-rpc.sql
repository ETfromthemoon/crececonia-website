-- Supabase expone solamente el esquema public por PostgREST. Estas funciones
-- son el borde privado entre el panel admin y las tablas del esquema commerce.

create or replace function public.get_class_aula_settings()
returns table (session_url text, whatsapp_group_url text, recording_url text, support_email text, classroom_enabled boolean, updated_at timestamptz)
language sql security definer set search_path = ''
as $$
  select session_url, whatsapp_group_url, recording_url, support_email, classroom_enabled, updated_at
  from commerce.class_aula_settings where product_key = 'clase:clase-en-vivo-2026-08-23';
$$;

create or replace function public.upsert_class_aula_settings(
  p_session_url text, p_whatsapp_group_url text, p_recording_url text, p_support_email text, p_classroom_enabled boolean
)
returns table (session_url text, whatsapp_group_url text, recording_url text, support_email text, classroom_enabled boolean, updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  return query
  insert into commerce.class_aula_settings as settings (
    product_key, session_url, whatsapp_group_url, recording_url, support_email, classroom_enabled, updated_at
  ) values (
    'clase:clase-en-vivo-2026-08-23', p_session_url, p_whatsapp_group_url, p_recording_url, p_support_email, p_classroom_enabled, now()
  ) on conflict (product_key) do update set
    session_url = excluded.session_url, whatsapp_group_url = excluded.whatsapp_group_url,
    recording_url = excluded.recording_url, support_email = excluded.support_email,
    classroom_enabled = excluded.classroom_enabled, updated_at = now()
  returning settings.session_url, settings.whatsapp_group_url, settings.recording_url,
    settings.support_email, settings.classroom_enabled, settings.updated_at;
end;
$$;

create or replace function public.class_admin_dashboard()
returns jsonb language sql security definer set search_path = ''
as $$
  select jsonb_build_object(
    'orders', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'commerce_order', c.commerce_order, 'email', c.email,
        'amount_minor', c.amount_minor, 'status', c.status, 'paid_at', c.paid_at,
        'created_at', c.created_at, 'offer_id', c.offer_id, 'flow_order', c.flow_order,
        'has_flow_token', c.flow_token is not null
      ) order by c.created_at desc)
      from commerce.class_orders c limit 200
    ), '[]'::jsonb),
    'offers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id, 'label', o.label, 'amount_minor', o.amount_minor,
        'total_cupos', o.total_cupos, 'sold_cupos', o.sold_cupos,
        'reserved_cupos', o.reserved_cupos, 'status', o.status
      ) order by o.sort_order)
      from commerce.product_offers o join commerce.products p on p.id = o.product_id
      where p.product_key = 'clase:clase-en-vivo-2026-08-23'
    ), '[]'::jsonb),
    'deliveries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'class_order_id', e.class_order_id, 'delivery_kind', e.delivery_kind,
        'status', e.status, 'sent_at', e.sent_at, 'last_error', e.last_error
      ) order by e.created_at desc)
      from commerce.class_delivery_events e
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_class_aula_settings() from public, anon, authenticated;
revoke all on function public.upsert_class_aula_settings(text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.class_admin_dashboard() from public, anon, authenticated;
grant execute on function public.get_class_aula_settings() to service_role;
grant execute on function public.upsert_class_aula_settings(text, text, text, text, boolean) to service_role;
grant execute on function public.class_admin_dashboard() to service_role;
