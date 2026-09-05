begin;
update public.launches
set cerneo_required = zernio_required,
    cerneo_status = case when zernio_status in ('connected','ready') then 'linked' else 'pending' end,
    cerneo_project_url = zernio_profile_id;

update public.launch_tasks
set category = case when category = 'zernio' then 'cerneo' else category end,
    owner = case when owner = 'Zernio' then 'CERNEO' else owner end,
    title = replace(title, 'Zernio', 'CERNEO'),
    instructions = replace(instructions, 'Zernio', 'CERNEO'),
    task_key = case when task_key = 'zernio-connection' then 'cerneo-project' else task_key end,
    updated_at = now()
where category = 'zernio' or owner = 'Zernio' or title like '%Zernio%' or instructions like '%Zernio%' or task_key = 'zernio-connection';
commit;
