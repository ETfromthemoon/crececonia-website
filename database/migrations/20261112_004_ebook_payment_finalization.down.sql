-- Disable ALL finalization consumers and reconcile/export receipts/effects first.
-- Existing grants and 003 jobs are intentionally retained. Never re-enable legacy
-- sending after rollback without reconciling accepted/ambiguous delivery jobs.
drop function commerce.finalize_ebook_payment(bigint, text, text, integer, text, jsonb, jsonb, text);
drop function commerce.read_ebook_finalization(bigint, text);
drop table commerce.ebook_payment_effects;
drop table commerce.ebook_payment_finalizations;
