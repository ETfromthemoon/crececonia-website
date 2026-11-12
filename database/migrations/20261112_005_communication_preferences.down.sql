-- Rollback destroys preference evidence: export and obtain explicit approval first.
drop function commerce.record_communication_preference(uuid, text, text, text, text, bigint, text, text, uuid);
drop table commerce.communication_preference_events;
drop table commerce.communication_preferences;
drop table commerce.communication_contacts;
