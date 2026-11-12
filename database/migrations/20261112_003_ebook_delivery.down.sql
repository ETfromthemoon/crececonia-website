-- Disable all callers first. Export any queued jobs before removing this table.
-- Never apply this rollback to discard outstanding paid deliveries.
drop function commerce.fail_ebook_delivery(uuid, uuid, text);
drop function commerce.accept_ebook_delivery(uuid, uuid, text);
drop function commerce.claim_ebook_deliveries(integer);
drop function commerce.enqueue_ebook_delivery(bigint, text, jsonb);
drop trigger ebook_delivery_identity_immutable on commerce.ebook_delivery_jobs;
drop function commerce.preserve_ebook_delivery_identity();
drop table commerce.ebook_delivery_jobs;
