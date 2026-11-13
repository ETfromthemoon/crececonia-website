-- Run after 20261112_002_nitido_sync.up.sql on an isolated Neon branch.
-- PUBLIC grants are inherited by anon/authenticated, so verify ACLs directly
-- as well as effective privileges on both API roles.
do $$
declare
  table_acl aclitem[];
  function_acl aclitem[];
  function_name text;
begin
  select coalesce(relacl, acldefault('r', relowner)) into table_acl
    from pg_class where oid = 'commerce.nitido_sync_jobs'::regclass;
  if table_acl is null
     or exists (select 1 from aclexplode(table_acl) a where a.grantee = 0)
     or has_table_privilege('anon', 'commerce.nitido_sync_jobs', 'select,insert,update,delete')
     or has_table_privilege('authenticated', 'commerce.nitido_sync_jobs', 'select,insert,update,delete') then
    raise exception 'nitido_sync_jobs is accessible to public roles';
  end if;

  foreach function_name in array array[
    'commerce.enqueue_nitido_qualification()'::text,
    'commerce.claim_nitido_sync_job(uuid)'::text,
    'commerce.ack_nitido_sync_job(uuid,uuid,text,uuid,text)'::text
  ] loop
    select coalesce(p.proacl, acldefault('f', p.proowner)) into function_acl
      from pg_proc p where p.oid = function_name::regprocedure;
    if function_acl is null
       or exists (select 1 from aclexplode(function_acl) a where a.grantee = 0)
       or has_function_privilege('anon', function_name, 'execute')
       or has_function_privilege('authenticated', function_name, 'execute') then
      raise exception 'function % is executable by public roles', function_name;
    end if;
  end loop;
end;
$$;
