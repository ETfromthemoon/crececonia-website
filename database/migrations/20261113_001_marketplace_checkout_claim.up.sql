begin;

alter table public.marketplace_orders
  add column request_digest char(64),
  add column flow_checkout_url text;
create index marketplace_orders_buyer_created_idx
  on public.marketplace_orders (buyer_email, created_at desc);

create function public.claim_marketplace_checkout(
  p_order_id uuid, p_request_id uuid, p_digest char(64), p_email text,
  p_book_id uuid, p_revision_id uuid, p_seller_id uuid, p_storage_key text,
  p_price bigint, p_tax_mode text, p_tax_rate integer, p_tax bigint,
  p_commission integer
) returns table (outcome text, claimed_order_id uuid)
language plpgsql as $$
declare existing public.marketplace_orders%rowtype;
begin
  -- Serialize the per-buyer quota and retries across all server instances.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 1));
  perform pg_advisory_xact_lock(hashtextextended(p_email, 0));
  select * into existing from public.marketplace_orders
    where idempotency_key = p_request_id::text;
  if found then
    if existing.request_digest = p_digest then
      return query select 'replay'::text, existing.id;
    else
      return query select 'conflict'::text, existing.id;
    end if;
    return;
  end if;
  -- A fresh UUID must not bypass an earlier, still payable attempt for this book.
  select o.* into existing from public.marketplace_orders o
    join public.marketplace_order_items i on i.order_id=o.id
    where o.buyer_email=p_email and i.book_id=p_book_id
      and o.status='pending' and o.expires_at>now()
    order by o.created_at desc limit 1;
  if found then
    return query select 'pending_other'::text, existing.id;
    return;
  end if;
  if (select count(*) from public.marketplace_orders
      where buyer_email = p_email and created_at > now() - interval '1 hour') >= 5 then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;
  if not exists (
    select 1 from public.marketplace_books b
    join public.marketplace_sellers s on s.id=b.seller_id and s.status='active'
    join public.marketplace_seller_tax_profiles t on t.seller_id=s.id and t.review_status='verified'
    join public.marketplace_book_revisions r on r.id=b.published_revision_id
      and r.book_id=b.id and r.moderation_status='approved' and r.rights_declared_at is not null
    join public.marketplace_assets a on a.revision_id=r.id and a.book_id=b.id
      and a.asset_kind='ebook_pdf' and a.scan_status='ready'
    where b.id=p_book_id and b.status='published' and b.published_at is not null
      and s.id=p_seller_id and r.id=p_revision_id and a.storage_key=p_storage_key
      and r.price_minor=p_price and r.price_tax_mode=p_tax_mode
  ) then
    return query select 'unavailable'::text, null::uuid;
    return;
  end if;
  insert into public.marketplace_orders
    (id,buyer_email,status,idempotency_key,request_digest,subtotal_minor,total_minor,expires_at)
    values (p_order_id,p_email,'pending',p_request_id::text,p_digest,p_price,p_price,now()+interval '30 minutes');
  insert into public.marketplace_order_items
    (order_id,book_id,revision_id,seller_id,price_minor,tax_mode,tax_rate_bps,
     tax_minor,commission_rate_bps,commission_basis_minor,commission_minor)
    values (p_order_id,p_book_id,p_revision_id,p_seller_id,p_price,p_tax_mode,p_tax_rate,
      p_tax,500,p_price,p_commission);
  return query select 'created'::text,p_order_id;
end $$;

revoke all on function public.claim_marketplace_checkout(uuid,uuid,char(64),text,uuid,uuid,uuid,text,bigint,text,integer,bigint,integer) from public;
commit;
