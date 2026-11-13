begin;

-- Never destroy consent evidence implicitly. Export and obtain explicit approval first.
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
