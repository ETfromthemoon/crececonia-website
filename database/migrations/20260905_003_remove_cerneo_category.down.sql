begin;
alter table public.launches add column cerneo_required boolean not null default true;
alter table public.launches add column cerneo_status text not null default 'pending' check (cerneo_status in ('pending','linked','ready'));
alter table public.launches add column cerneo_project_url text;
update public.launches set cerneo_required=zernio_required, cerneo_status=case when zernio_status in ('connected','ready') then 'linked' else 'pending' end, cerneo_project_url=zernio_profile_id;
alter table public.launch_tasks drop constraint if exists launch_tasks_category_check;
alter table public.launch_tasks add constraint launch_tasks_category_check check (category in ('zernio','cerneo','publications','dm','ads','automation','delivery','analytics'));
commit;
