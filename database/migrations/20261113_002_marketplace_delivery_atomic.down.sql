begin;
lock table public.marketplace_outbox in access exclusive mode;
do $$ begin
  if exists(select 1 from public.marketplace_outbox) then
    raise exception 'marketplace delivery down requires empty outbox';
  end if;
end $$;
drop function if exists public.marketplace_confirm_sandbox_payment(uuid,text,bigint,bigint,text,text);
alter table public.marketplace_outbox drop column if exists claim_token;
alter table public.marketplace_outbox drop column if exists delivery_token_expires_at;
commit;
