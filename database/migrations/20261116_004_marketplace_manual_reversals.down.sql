begin;

do $$
begin
  if exists (select 1 from public.marketplace_refunds where reason_code in ('refund', 'chargeback')) then
    raise exception 'marketplace reversal rollback blocked: external reversals exist';
  end if;
end;
$$;

drop trigger if exists marketplace_completed_refund_immutable on public.marketplace_refunds;
drop function public.marketplace_preserve_completed_refund();
drop function public.marketplace_record_external_reversal(uuid, text, text, text);

commit;
