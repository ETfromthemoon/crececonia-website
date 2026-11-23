-- Run only on an isolated Neon validation branch after migration 007.
-- All fixture rows and reservations are rolled back at the end.
begin;

do $$
declare
  launch_id uuid;
  tier_id uuid;
  slug text := 'e10-test-' || replace(gen_random_uuid()::text, '-', '');
  order_name text := 'launch-test-' || replace(gen_random_uuid()::text, '-', '');
  retry_name text := 'launch-retry-' || replace(gen_random_uuid()::text, '-', '');
  third_name text := 'launch-third-' || replace(gen_random_uuid()::text, '-', '');
  fourth_name text := 'launch-fourth-' || replace(gen_random_uuid()::text, '-', '');
  multi_product_slug text := 'e10-multi-' || replace(gen_random_uuid()::text, '-', '');
  multi_product_order text := 'launch-multi-' || replace(gen_random_uuid()::text, '-', '');
  resource_name text := 'ebook:e10-test';
  key_hash bytea := decode(repeat('11', 32), 'hex');
  second_key_hash bytea := decode(repeat('22', 32), 'hex');
  third_key_hash bytea := decode(repeat('33', 32), 'hex');
  fourth_key_hash bytea := decode(repeat('44', 32), 'hex');
  multi_product_key_hash bytea := decode(repeat('55', 32), 'hex');
  result jsonb;
  reserved integer;
  multi_product_launch_id uuid;
  multi_product_tier_id uuid;
begin
  insert into public.launches (slug, name, launch_type, status, headline, description)
    values (slug, 'Prueba E10', 'ebook_release', 'published', 'Prueba', '') returning id into launch_id;
  insert into public.launch_products (launch_id, resource, title_snapshot, role, sort_order)
    values (launch_id, resource_name, 'Ebook prueba', 'primary', 0);
  insert into public.launch_price_tiers (launch_id, label, amount_minor, capacity, sold_count, reserved_count, sort_order, status)
    values (launch_id, 'Tramo de prueba', 15000, 2, 0, 0, 0, 'active') returning id into tier_id;

  update public.launches set starts_at = now() + interval '1 hour' where id = launch_id;
  begin
    perform commerce.reserve_launch_checkout(order_name, key_hash, slug, 'buyer@example.test');
    raise exception 'future_launch_reservation_was_allowed';
  exception when others then
    if sqlerrm = 'future_launch_reservation_was_allowed' then raise; end if;
    if sqlerrm <> 'launch_checkout_unavailable' then raise; end if;
  end;
  update public.launches set starts_at = now() - interval '1 minute' where id = launch_id;

  result := commerce.reserve_launch_checkout(order_name, key_hash, slug, 'buyer@example.test');
  if result->>'amount_minor' <> '15000' or result->>'resource' <> resource_name or result->>'status' <> 'creating' then
    raise exception 'reservation_snapshot_invalid';
  end if;
  -- Same key, buyer, and launch returns the original order despite a newly generated candidate id.
  result := commerce.reserve_launch_checkout(retry_name, key_hash, slug, 'buyer@example.test');
  if result->>'commerce_order' <> order_name then raise exception 'idempotent_reservation_replaced'; end if;
  begin
    perform commerce.reserve_launch_checkout(retry_name, key_hash, slug, 'other@example.test');
    raise exception 'idempotency_email_conflict_was_allowed';
  exception when others then
    if sqlerrm = 'idempotency_email_conflict_was_allowed' then raise; end if;
    if sqlerrm <> 'launch_checkout_idempotency_conflict' then raise; end if;
  end;

  if not commerce.mark_launch_checkout_creation_submitted(order_name) then raise exception 'submit_state_not_saved'; end if;
  if not commerce.mark_launch_checkout_creation_unknown(order_name) then raise exception 'ambiguous_state_not_saved'; end if;
  result := commerce.attach_launch_flow_order(order_name, 987654321);
  if result->>'status' <> 'pending' or result->>'flow_order' <> '987654321' then raise exception 'flow_order_not_attached'; end if;

  result := commerce.record_launch_flow_status(order_name, 987654321, 2, 'other@example.test', 14999);
  if result->>'status' <> 'needs_review' then raise exception 'paid_mismatch_not_quarantined'; end if;
  select reserved_count into reserved from public.launch_price_tiers where id = tier_id;
  if reserved <> 1 then raise exception 'paid_mismatch_released_capacity'; end if;

  -- A later rejection/cancellation cannot erase evidence of an earlier paid response.
  result := commerce.record_launch_flow_status(order_name, 987654321, 3, 'buyer@example.test', 15000);
  if result->>'status' <> 'needs_review' then raise exception 'paid_order_was_released_after_terminal_status'; end if;
  select reserved_count into reserved from public.launch_price_tiers where id = tier_id;
  if reserved <> 1 then raise exception 'paid_order_capacity_was_released'; end if;

  result := commerce.reserve_launch_checkout(retry_name, second_key_hash, slug, 'buyer@example.test');
  if not commerce.mark_launch_checkout_creation_submitted(retry_name) then raise exception 'second_order_submit_state_not_saved'; end if;
  result := commerce.attach_launch_flow_order(retry_name, 987654322);
  result := commerce.record_launch_flow_status(retry_name, 987654322, 3, 'buyer@example.test', 15000);
  if result->>'status' <> 'rejected' then raise exception 'rejection_not_recorded'; end if;

  result := commerce.reserve_launch_checkout(third_name, third_key_hash, slug, 'buyer@example.test');
  if not commerce.mark_launch_checkout_creation_submitted(third_name) then raise exception 'third_order_submit_state_not_saved'; end if;
  result := commerce.attach_launch_flow_order(third_name, 987654323);
  -- A late paid readback after a terminal rejection is preserved, but it cannot reclaim a full tier.
  result := commerce.record_launch_flow_status(retry_name, 987654322, 2, 'buyer@example.test', 15000);
  if result->>'status' <> 'needs_review' or result->>'capacity_held' <> 'false' or result->>'capacity_exception' <> 'true' then
    raise exception 'late_paid_capacity_conflict_not_quarantined';
  end if;
  if result->>'observed_payment_payer' <> 'buyer@example.test' or result->>'observed_payment_amount' <> '15000' then
    raise exception 'late_payment_evidence_not_saved';
  end if;

  result := commerce.record_launch_flow_status(third_name, 987654323, 3, 'buyer@example.test', 15000);
  if result->>'status' <> 'rejected' then raise exception 'third_order_rejection_not_recorded'; end if;
  perform commerce.record_launch_flow_status(third_name, 987654323, 3, 'buyer@example.test', 15000);
  select reserved_count into reserved from public.launch_price_tiers where id = tier_id;
  if reserved <> 1 then raise exception 'terminal_replay_changed_capacity'; end if;

  begin
    perform commerce.reserve_launch_checkout(fourth_name, fourth_key_hash, slug, 'buyer@example.test');
    raise exception 'capacity_exception_was_not_counted';
  exception when others then
    if sqlerrm = 'capacity_exception_was_not_counted' then raise; end if;
    if sqlerrm <> 'launch_checkout_sold_out' then raise; end if;
  end;

  begin
    update commerce.launch_checkout_orders set amount_minor = 1 where commerce_order = order_name;
    raise exception 'identity_mutation_was_allowed';
  exception when others then
    if sqlerrm = 'identity_mutation_was_allowed' then raise; end if;
    if sqlerrm <> 'launch_checkout_identity_immutable' then raise; end if;
  end;

  if has_table_privilege('anon', 'commerce.launch_checkout_orders', 'SELECT')
     or has_table_privilege('authenticated', 'commerce.launch_checkout_orders', 'SELECT') then
    raise exception 'private_orders_readable_by_public_role';
  end if;

  -- Reject an invalid product set without creating an order or reserving capacity.
  insert into public.launches (slug, name, launch_type, status, headline, description)
    values (multi_product_slug, 'Prueba E10 multilibro', 'ebook_release', 'published', 'Prueba', '')
    returning id into multi_product_launch_id;
  insert into public.launch_products (launch_id, resource, title_snapshot, role, sort_order) values
    (multi_product_launch_id, 'ebook:e10-first', 'Primer ebook', 'primary', 0),
    (multi_product_launch_id, 'ebook:e10-second', 'Segundo ebook', 'included', 1);
  insert into public.launch_price_tiers (launch_id, label, amount_minor, capacity, sold_count, reserved_count, sort_order, status)
    values (multi_product_launch_id, 'Tramo de prueba', 15000, 2, 0, 0, 0, 'active')
    returning id into multi_product_tier_id;
  begin
    perform commerce.reserve_launch_checkout(multi_product_order, multi_product_key_hash, multi_product_slug, 'buyer@example.test');
    raise exception 'multiple_products_were_allowed';
  exception when others then
    if sqlerrm = 'multiple_products_were_allowed' then raise; end if;
    if sqlerrm <> 'launch_checkout_requires_one_product' then raise; end if;
  end;
  if exists (select 1 from commerce.launch_checkout_orders where commerce_order = multi_product_order) then
    raise exception 'invalid_product_set_created_order';
  end if;
  select reserved_count into reserved from public.launch_price_tiers where id = multi_product_tier_id;
  if reserved <> 0 then raise exception 'invalid_product_set_reserved_capacity'; end if;
end;
$$;

rollback;
