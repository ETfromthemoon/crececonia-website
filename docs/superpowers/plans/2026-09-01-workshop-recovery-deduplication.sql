-- Acota la recuperación a abandonos recientes y a un mensaje por persona.
-- Forward-only: reemplaza únicamente la lógica de selección, sin borrar datos.

create or replace function public.claim_workshop_checkout_recoveries(p_product_key text)
returns table(recovery_id uuid, email text, original_amount integer, discounted_amount integer)
language plpgsql
security definer
set search_path=''
as $$
begin
  perform commerce.release_expired_class_reservations();

  return query
  with candidates as (
    select distinct on (lower(c.email)) c.id, c.email, c.amount_minor
    from commerce.class_orders c
    join commerce.products p on p.id = c.product_id
    where p.product_key = p_product_key
      and c.status = 'released'
      and c.created_at <= now() - interval '30 minutes'
      and c.created_at >= now() - interval '24 hours'
      and not exists (
        select 1
        from commerce.class_orders paid
        where paid.product_id = c.product_id
          and lower(paid.email) = lower(c.email)
          and paid.status = 'paid'
      )
      and not exists (
        select 1
        from commerce.workshop_checkout_recoveries previous
        where previous.product_key = p_product_key
          and lower(previous.email) = lower(c.email)
          and (
            previous.class_order_id <> c.id
            or (
              previous.status <> 'failed'
              and not (previous.status='processing' and previous.updated_at < now() - interval '15 minutes')
            )
          )
      )
    order by lower(c.email), c.created_at desc
  ), claimed as (
    insert into commerce.workshop_checkout_recoveries as recovery (
      class_order_id, product_key, email, original_amount, discounted_amount, status, attempts, updated_at
    )
    select candidates.id, p_product_key, candidates.email, candidates.amount_minor,
      round(candidates.amount_minor::numeric * 0.90)::integer, 'processing', 1, now()
    from candidates
    on conflict (class_order_id) do update
      set status='processing', attempts=recovery.attempts+1, last_error=null, updated_at=now()
      where recovery.status='failed'
         or (recovery.status='processing' and recovery.updated_at < now() - interval '15 minutes')
    returning recovery.id, recovery.email, recovery.original_amount, recovery.discounted_amount
  )
  select claimed.id, claimed.email, claimed.original_amount, claimed.discounted_amount
  from claimed;
end
$$;
