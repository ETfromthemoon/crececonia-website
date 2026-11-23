begin;

do $$
begin
  if exists (select 1 from public.marketplace_gateway_fee_evidence) then
    raise exception 'marketplace gateway fee evidence rollback blocked: evidence exists';
  end if;
end;
$$;

drop function public.marketplace_record_gateway_fee(uuid, bigint, text, text);
drop trigger if exists marketplace_gateway_fee_evidence_immutable on public.marketplace_gateway_fee_evidence;
drop table public.marketplace_gateway_fee_evidence;

commit;
