begin;

-- Preserve fiscal evidence once any row has been recorded.
do $$
begin
  if exists (select 1 from public.marketplace_fiscal_evidence) then
    raise exception 'marketplace fiscal evidence rollback blocked: records exist';
  end if;
end;
$$;

drop trigger if exists marketplace_fiscal_evidence_immutable on public.marketplace_fiscal_evidence;
drop table if exists public.marketplace_fiscal_evidence;

commit;
