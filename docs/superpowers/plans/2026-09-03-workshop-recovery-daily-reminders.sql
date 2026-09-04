-- Recordatorios diarios de checkout abandonado hasta el inicio del workshop.
-- Forward-only: conserva el historial y reutiliza una sola recuperación por persona.

create or replace function public.claim_workshop_checkout_recoveries(p_product_key text)
returns table(recovery_id uuid, email text, original_amount integer, discounted_amount integer)
language plpgsql
security definer
set search_path=''
as $$
begin
  -- No se generan nuevos correos cuando la clase ya comenzó.
  if now() >= timestamptz '2026-09-06 17:00:00-03' then
    return;
  end if;

  perform commerce.release_expired_class_reservations();

  return query
  with latest_per_email as (
    select distinct on (lower(c.email))
      c.id,
      c.email,
      c.amount_minor,
      r.id as recovery_id,
      r.status as recovery_status,
      r.sent_at,
      r.updated_at as recovery_updated_at,
      r.attempts as recovery_attempts
    from commerce.class_orders c
    join commerce.products p on p.id = c.product_id
    left join commerce.workshop_checkout_recoveries r on r.class_order_id = c.id
    where p.product_key = p_product_key
      and c.status = 'released'
      and c.created_at <= now() - interval '30 minutes'
      and not exists (
        select 1
        from commerce.class_orders paid
        where paid.product_id = c.product_id
          and lower(paid.email) = lower(c.email)
          and paid.status = 'paid'
      )
    -- Si ya existe una recuperación para el correo, se prioriza esa orden y se
    -- evita crear otra fila cuando la persona reintentó el checkout.
    order by lower(c.email), (r.id is not null) desc, c.created_at desc
  ), candidates as (
    select *
    from latest_per_email
    where recovery_id is null
       or recovery_status = 'failed'
       or (recovery_status = 'sent' and sent_at <= now() - interval '24 hours')
       or (recovery_status = 'processing' and recovery_updated_at < now() - interval '15 minutes')
  ), claimed as (
    insert into commerce.workshop_checkout_recoveries as recovery (
      class_order_id,
      product_key,
      email,
      original_amount,
      discounted_amount,
      status,
      attempts,
      updated_at
    )
    select
      candidates.id,
      p_product_key,
      candidates.email,
      candidates.amount_minor,
      round(candidates.amount_minor::numeric * 0.90)::integer,
      'processing',
      case when candidates.recovery_id is null then 1 else candidates.recovery_attempts + 1 end,
      now()
    from candidates
    on conflict (class_order_id) do update
      set status = 'processing',
          attempts = recovery.attempts + 1,
          last_error = null,
          updated_at = now()
      where recovery.status = 'failed'
         or (recovery.status = 'sent' and recovery.sent_at <= now() - interval '24 hours')
         or (recovery.status = 'processing' and recovery.updated_at < now() - interval '15 minutes')
    returning recovery.id, recovery.email, recovery.original_amount, recovery.discounted_amount
  )
  select claimed.id, claimed.email, claimed.original_amount, claimed.discounted_amount
  from claimed;
end
$$;
