-- Export any collected leads before rollback. Revert the application first.
drop function commerce.register_service_qualification(uuid, text, text, jsonb, text);
drop table commerce.service_qualifications;
