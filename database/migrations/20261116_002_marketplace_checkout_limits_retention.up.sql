begin;

create index marketplace_checkout_limits_updated_at_idx
  on public.marketplace_checkout_limits(updated_at);

commit;
