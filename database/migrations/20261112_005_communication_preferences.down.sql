begin;

-- Never destroy consent evidence implicitly. Export and obtain explicit approval first.
-- Lock in the same first-touch order as record_communication_preference so a
-- writer already holding the event-table lock can finish before we inspect rows.
lock table commerce.communication_preference_events in access exclusive mode;
lock table commerce.communication_contacts in access exclusive mode;
lock table commerce.communication_preferences in access exclusive mode;

do $$
begin
  if exists (select 1 from commerce.communication_preference_events)
     or exists (select 1 from commerce.communication_preferences)
     or exists (select 1 from commerce.communication_contacts) then
    raise exception 'refusing_to_drop_nonempty_communication_preferences';
  end if;
end;
$$;

drop function commerce.record_communication_preference(uuid, text, text, text, text, bigint, text, text, uuid);
drop table commerce.communication_preference_events;
drop table commerce.communication_preferences;
drop table commerce.communication_contacts;

commit;
