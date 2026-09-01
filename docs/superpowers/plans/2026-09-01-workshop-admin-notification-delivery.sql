-- Forward-only, backward-compatible migration.
-- Tracks the administrator purchase notification in the same durable delivery
-- outbox used by attendee emails, so a transient Resend failure can be retried.

create or replace function public.claim_workshop_delivery(
  p_product_key text,
  p_delivery_kind text,
  p_commerce_order text default null
)
returns table(event_id uuid, commerce_order text, email text, amount_minor integer)
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_delivery_kind not in (
    'admin-notification',
    'welcome',
    'ebooks',
    'session-1h',
    'session-10m',
    'session-late',
    'follow-up'
  ) then
    raise exception 'invalid delivery kind';
  end if;

  return query
  with candidates as (
    select c.id, c.commerce_order, c.email, c.amount_minor
    from commerce.class_orders c
    join commerce.products p on p.id = c.product_id
    where p.product_key = p_product_key
      and c.status = 'paid'
      and (p_commerce_order is null or c.commerce_order = p_commerce_order)
  ), claimed as (
    insert into commerce.class_delivery_events as e (
      class_order_id,
      delivery_kind,
      status,
      attempts,
      updated_at
    )
    select id, p_delivery_kind, 'processing', 1, now()
    from candidates
    on conflict (class_order_id, delivery_kind) do update
      set status = 'processing',
          attempts = e.attempts + 1,
          last_error = null,
          updated_at = now()
      where e.status = 'failed'
         or (e.status = 'processing' and e.updated_at < now() - interval '15 minutes')
    returning e.id, e.class_order_id
  )
  select claimed.id, candidates.commerce_order, candidates.email, candidates.amount_minor
  from claimed
  join candidates on candidates.id = claimed.class_order_id;
end
$$;

revoke all on function public.claim_workshop_delivery(text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_workshop_delivery(text, text, text)
  to service_role;
