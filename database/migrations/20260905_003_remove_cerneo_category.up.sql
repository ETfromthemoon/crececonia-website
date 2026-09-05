begin;
alter table public.launch_tasks drop constraint if exists launch_tasks_category_check;
alter table public.launch_tasks add constraint launch_tasks_category_check check (category in ('zernio','publications','dm','ads','automation','delivery','analytics'));
alter table public.launches drop column cerneo_project_url;
alter table public.launches drop column cerneo_status;
alter table public.launches drop column cerneo_required;
commit;
