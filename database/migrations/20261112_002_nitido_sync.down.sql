-- Stop the local worker, disable NITIDO_SYNC_KEY and export pending/review jobs
-- before rollback. Dropping this queue does not remove saved qualifications.
begin;
drop trigger enqueue_nitido_qualification on commerce.service_qualifications;
drop function commerce.enqueue_nitido_qualification();
drop function commerce.claim_nitido_sync_job(uuid);
drop function commerce.ack_nitido_sync_job(uuid, uuid, text, uuid, text);
drop table commerce.nitido_sync_jobs;
commit;
