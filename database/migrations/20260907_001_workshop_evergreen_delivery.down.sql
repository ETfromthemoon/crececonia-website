-- Revierte las capacidades de recuperación. La corrección de ambigüedad se
-- conserva porque restaurar deliberadamente una función que falla en runtime
-- no es una reversión segura.

drop function if exists public.claim_workshop_access_recovery(text,text);
drop function if exists public.complete_workshop_access_recovery(uuid,text);
drop function if exists public.fail_workshop_access_recovery(uuid,text);
drop function if exists public.requeue_workshop_follow_up(text);
drop table if exists commerce.workshop_access_recoveries;

create or replace function public.record_workshop_email_event(p_provider_message_id text,p_event_type text,p_event_at timestamptz)
returns boolean language sql security definer set search_path='' as $$
  update commerce.class_delivery_events set provider_status=p_event_type,
    delivered_at=case when p_event_type='email.delivered' then coalesce(delivered_at,p_event_at) else delivered_at end,
    bounced_at=case when p_event_type in('email.bounced','email.failed','email.suppressed') then coalesce(bounced_at,p_event_at) else bounced_at end,
    opened_at=case when p_event_type='email.opened' then coalesce(opened_at,p_event_at) else opened_at end,
    clicked_at=case when p_event_type='email.clicked' then coalesce(clicked_at,p_event_at) else clicked_at end,
    updated_at=now()
  where provider_message_id=p_provider_message_id returning true
$$;

revoke all on function public.record_workshop_email_event(text,text,timestamptz)
from public,anon,authenticated;
grant execute on function public.record_workshop_email_event(text,text,timestamptz)
to service_role;
