-- Operaciones manuales del panel del workshop. Aplicar antes del deploy.

create or replace function public.admin_advance_workshop_tier(p_product_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_product_id uuid;
  v_current commerce.product_offers%rowtype;
  v_next_order integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_product_key));
  select p.id into v_product_id from commerce.products p where p.product_key=p_product_key and p.status='active' limit 1;
  select o.* into v_current from commerce.product_offers o where o.product_id=v_product_id and o.status='active' order by o.sort_order asc limit 1 for update;
  if not found then raise exception 'No hay un tramo activo.'; end if;
  if v_current.offer_key='recording' then raise exception 'La grabación tiene precio fijo.'; end if;

  update commerce.product_offers set status='inactive' where id=v_current.id;
  select coalesce(max(sort_order),0)+1 into v_next_order from commerce.product_offers where product_id=v_product_id and offer_key<>'recording';
  insert into commerce.product_offers(product_id,offer_key,label,amount_minor,total_cupos,sold_cupos,reserved_cupos,sort_order,status)
  values(v_product_id,'tier-'||v_next_order,'Tramo '||v_next_order,v_current.amount_minor+5000,5,0,0,v_next_order,'active')
  on conflict(product_id,offer_key) do update set label=excluded.label,amount_minor=excluded.amount_minor,total_cupos=excluded.total_cupos,status='active';
  return true;
end $$;

create or replace function public.admin_register_workshop_purchase(p_product_key text,p_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_offer record;
  v_order text := 'workshop-manual-'||floor(extract(epoch from clock_timestamp())*1000)::bigint||'-'||substr(gen_random_uuid()::text,1,8);
  v_token text := 'manual-'||gen_random_uuid()::text;
  v_flow_order bigint := -floor(extract(epoch from clock_timestamp())*1000)::bigint;
  v_finalized boolean;
begin
  if p_email is null or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Correo inválido.'; end if;
  -- Un reintento del navegador recupera la misma alta y deja que el sistema
  -- de entregas reanude sólo los correos que todavía no fueron enviados.
  select c.commerce_order into v_order
  from commerce.class_orders c join commerce.products p on p.id=c.product_id
  where p.product_key=p_product_key and c.email=lower(trim(p_email))
    and c.status='paid' and c.commerce_order like 'workshop-manual-%'
  order by c.created_at desc limit 1;
  if found then return v_order; end if;

  v_order := 'workshop-manual-'||floor(extract(epoch from clock_timestamp())*1000)::bigint||'-'||substr(gen_random_uuid()::text,1,8);
  select * into v_offer from public.workshop_product_availability(p_product_key) limit 1;
  if not found or v_offer.sold_cupos+v_offer.reserved_cupos>=v_offer.total_cupos then raise exception 'No hay entradas disponibles.'; end if;
  perform public.create_class_order(v_offer.product_id,v_offer.offer_id,v_order,lower(trim(p_email)),v_offer.amount_minor);
  select public.finalize_class_order(v_order,v_token,v_flow_order,v_offer.amount_minor) into v_finalized;
  if v_finalized is distinct from true then raise exception 'No se pudo confirmar la compra manual.'; end if;
  return v_order;
end $$;

revoke all on function public.admin_advance_workshop_tier(text),public.admin_register_workshop_purchase(text,text) from public,anon,authenticated;
grant execute on function public.admin_advance_workshop_tier(text),public.admin_register_workshop_purchase(text,text) to service_role;
