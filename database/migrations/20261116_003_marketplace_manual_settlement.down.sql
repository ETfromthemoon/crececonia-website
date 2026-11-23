begin;

do $$ begin
  if exists (select 1 from public.marketplace_settlements where provider = 'manual_bank') then
    raise exception 'manual settlement rollback blocked: payouts exist';
  end if;
end $$;

drop function if exists public.marketplace_record_manual_settlement(uuid, bigint, text, timestamptz);
drop trigger if exists marketplace_manual_settlements_immutable on public.marketplace_settlements;
drop function if exists public.marketplace_preserve_manual_settlement();
drop view if exists public.marketplace_seller_payout_balances;

commit;
