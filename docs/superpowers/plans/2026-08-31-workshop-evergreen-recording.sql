-- Convierte automáticamente el workshop en un producto evergreen grabado.
-- Antes del cierre mantiene los tramos de cinco cupos; después ofrece la
-- grabación a $20.000 CLP con capacidad operativa amplia y precio fijo.

drop function if exists public.workshop_product_availability(text);

create or replace function public.workshop_product_availability(p_product_key text)
returns table(
  product_id uuid,
  product_name text,
  offer_id uuid,
  offer_key text,
  label text,
  amount_minor integer,
  total_cupos integer,
  sold_cupos integer,
  reserved_cupos integer,
  sales_today integer,
  revenue_today bigint,
  next_amount_minor integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_product_name text;
  v_offer commerce.product_offers%rowtype;
  v_last commerce.product_offers%rowtype;
  v_next_order integer;
  v_recording_started boolean := now() >= '2026-09-06T20:00:00-03:00'::timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext(p_product_key));

  select p.id, p.name
  into v_product_id, v_product_name
  from commerce.products p
  where p.product_key = p_product_key
    and p.status = 'active'
  limit 1;

  if v_product_id is null then
    return;
  end if;

  if v_recording_started then
    insert into commerce.product_offers (
      product_id, offer_key, label, amount_minor, total_cupos,
      sold_cupos, reserved_cupos, sort_order, status
    ) values (
      v_product_id, 'recording', 'Clase grabada', 20000, 1000000,
      0, 0, 1000000, 'active'
    )
    on conflict (product_id, offer_key) do update
    set label = excluded.label,
        amount_minor = excluded.amount_minor,
        total_cupos = greatest(commerce.product_offers.total_cupos, 1000000),
        status = 'active'
    returning * into v_offer;
  else
    select o.*
    into v_offer
    from commerce.product_offers o
    where o.product_id = v_product_id
      and o.offer_key <> 'recording'
      and o.status = 'active'
      and o.sold_cupos + o.reserved_cupos < o.total_cupos
    order by o.sort_order asc
    limit 1
    for update;

    if not found then
      select o.*
      into v_last
      from commerce.product_offers o
      where o.product_id = v_product_id
        and o.offer_key <> 'recording'
      order by o.sort_order desc
      limit 1
      for update;

      if not found then
        raise exception 'workshop_offer_missing';
      end if;

      v_next_order := v_last.sort_order + 1;
      insert into commerce.product_offers (
        product_id, offer_key, label, amount_minor, total_cupos,
        sold_cupos, reserved_cupos, sort_order, status
      ) values (
        v_product_id, 'tier-' || v_next_order::text, 'Tramo ' || v_next_order::text,
        v_last.amount_minor + 5000, 5, 0, 0, v_next_order, 'active'
      )
      returning * into v_offer;
    end if;
  end if;

  return query
  select
    v_product_id,
    v_product_name,
    v_offer.id,
    v_offer.offer_key,
    v_offer.label,
    v_offer.amount_minor,
    v_offer.total_cupos,
    v_offer.sold_cupos,
    v_offer.reserved_cupos,
    (select count(*)::integer from commerce.class_orders c
      where c.product_id = v_product_id and c.status = 'paid'
        and (c.paid_at at time zone 'America/Santiago')::date = (now() at time zone 'America/Santiago')::date),
    (select coalesce(sum(c.amount_minor), 0)::bigint from commerce.class_orders c
      where c.product_id = v_product_id and c.status = 'paid'
        and (c.paid_at at time zone 'America/Santiago')::date = (now() at time zone 'America/Santiago')::date),
    case when v_recording_started then 20000 else v_offer.amount_minor + 5000 end;
end;
$$;

revoke all on function public.workshop_product_availability(text)
from public, anon, authenticated;
grant execute on function public.workshop_product_availability(text)
to service_role;
