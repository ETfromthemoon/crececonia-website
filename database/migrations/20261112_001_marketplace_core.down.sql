begin;

-- Hold locks through the empty check so rollback cannot discard live rows.
do $$
declare
  table_name text;
  tables text[] := array[
    'marketplace_sellers', 'marketplace_books', 'marketplace_book_revisions',
    'marketplace_assets', 'marketplace_orders', 'marketplace_order_items',
    'marketplace_payments', 'marketplace_payment_events', 'marketplace_entitlements',
    'marketplace_ledger_entries', 'marketplace_refunds', 'marketplace_settlements',
    'marketplace_outbox', 'marketplace_audit_log'
  ];
  has_rows boolean;
begin
  foreach table_name in array tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('lock table public.%I in access exclusive mode', table_name);
    end if;
  end loop;
  foreach table_name in array tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('select exists (select 1 from public.%I)', table_name) into has_rows;
      if has_rows then
        raise exception 'marketplace rollback blocked: % contains rows', table_name;
      end if;
    end if;
  end loop;
end;
$$;

drop trigger if exists marketplace_audit_immutable on public.marketplace_audit_log;
drop trigger if exists marketplace_ledger_immutable on public.marketplace_ledger_entries;
drop function if exists public.marketplace_reject_immutable_mutation();

drop table if exists public.marketplace_audit_log;
drop table if exists public.marketplace_outbox;
drop table if exists public.marketplace_settlements;
drop table if exists public.marketplace_refunds;
drop table if exists public.marketplace_ledger_entries;
drop table if exists public.marketplace_entitlements;
drop table if exists public.marketplace_payment_events;
drop table if exists public.marketplace_payments;
drop table if exists public.marketplace_order_items;
drop table if exists public.marketplace_orders;
drop table if exists public.marketplace_assets;
alter table if exists public.marketplace_books drop constraint if exists marketplace_books_current_revision_fk;
alter table if exists public.marketplace_books drop constraint if exists marketplace_books_published_revision_fk;
drop table if exists public.marketplace_book_revisions;
drop table if exists public.marketplace_books;
drop table if exists public.marketplace_sellers;

commit;
