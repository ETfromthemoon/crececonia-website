begin;
update public.launches
set zernio_required = cerneo_required,
    zernio_status = case when cerneo_status = 'linked' then 'connected' else cerneo_status end,
    zernio_profile_id = cerneo_project_url;

update public.launch_tasks
set category = case when category = 'cerneo' then 'zernio' else category end,
    owner = case when owner = 'CERNEO' then 'Zernio' else owner end,
    title = replace(replace(title, 'CERNEO', 'Zernio'), 'Cerneo', 'Zernio'),
    instructions = replace(replace(instructions, 'CERNEO', 'Zernio'), 'Cerneo', 'Zernio'),
    task_key = case when task_key = 'cerneo-project' then 'zernio-connection' else task_key end,
    updated_at = now()
where category = 'cerneo' or owner = 'CERNEO' or title like '%CERNEO%' or instructions like '%CERNEO%' or task_key = 'cerneo-project';
commit;
