begin;

do $$
begin
  if exists (select 1 from commerce.launch_checkout_orders) then
    raise exception 'refusing_to_drop_launch_checkout_orders_with_data';
  end if;
end;
$$;

drop function commerce.record_launch_flow_status(text, bigint, integer, text, integer);
drop function commerce.mark_launch_checkout_creation_unknown(text);
drop function commerce.mark_launch_checkout_creation_submitted(text);
drop function commerce.fail_launch_checkout_creation(text);
drop function commerce.attach_launch_flow_order(text, bigint);
drop function commerce.reserve_launch_checkout(text, bytea, text, text);
drop trigger launch_checkout_identity_immutable on commerce.launch_checkout_orders;
drop function commerce.preserve_launch_checkout_identity();
drop index commerce.launch_checkout_orders_pending_idx;
drop index commerce.launch_checkout_orders_launch_idx;
drop index commerce.launch_checkout_orders_tier_idx;
drop index commerce.launch_checkout_orders_capacity_exception_idx;
drop table commerce.launch_checkout_orders;

commit;
