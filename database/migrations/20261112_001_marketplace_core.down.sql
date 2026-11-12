begin;

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
drop table if exists public.marketplace_books;
drop table if exists public.marketplace_book_revisions;
drop table if exists public.marketplace_sellers;

commit;
