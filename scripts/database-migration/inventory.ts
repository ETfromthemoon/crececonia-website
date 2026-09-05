import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createRunDirectory,
  postgresEnvironment,
  publicDatabaseIdentity,
  requireDatabaseUrl,
  requirePostgresTools,
  run,
  selectedSchemas,
} from "./common";

function sql(schemas: string[]): string {
  const schemaList = schemas.map((schema) => `'${schema}'`).join(",");
  return String.raw`
with selected_schemas as (
  select oid,nspname from pg_namespace where nspname in (${schemaList})
), relations as (
  select n.nspname schema_name,c.relname,c.relkind,c.relrowsecurity,
         pg_total_relation_size(c.oid) total_bytes,coalesce(s.n_live_tup,0) estimated_rows
  from pg_class c join selected_schemas n on n.oid=c.relnamespace
  left join pg_stat_user_tables s on s.relid=c.oid
  where c.relkind in ('r','p','v','m','S')
)
select jsonb_build_object(
  'generated_at',now(),
  'server_version',current_setting('server_version'),
  'schemas',to_jsonb(array[${schemaList}]),
  'relations',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',schema_name,'name',relname,'kind',relkind,'rls',relrowsecurity,
    'estimated_rows',estimated_rows,'bytes',total_bytes
  ) order by schema_name,relname),'[]'::jsonb) from relations),
  'columns',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',n.nspname,'table',c.relname,'position',a.attnum,'name',a.attname,
    'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,
    'default',pg_get_expr(d.adbin,d.adrelid),'generated',a.attgenerated,'identity',a.attidentity
  ) order by n.nspname,c.relname,a.attnum),'[]'::jsonb)
    from pg_attribute a join pg_class c on c.oid=a.attrelid
    join selected_schemas n on n.oid=c.relnamespace
    left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
    where a.attnum>0 and not a.attisdropped and c.relkind in ('r','p','v','m')),
  'constraints',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',n.nspname,'table',c.relname,'name',co.conname,'type',co.contype,
    'definition',pg_get_constraintdef(co.oid,true)
  ) order by n.nspname,c.relname,co.conname),'[]'::jsonb)
    from pg_constraint co join pg_class c on c.oid=co.conrelid
    join selected_schemas n on n.oid=c.relnamespace),
  'indexes',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',schemaname,'table',tablename,'name',indexname,'definition',indexdef
  ) order by schemaname,tablename,indexname),'[]'::jsonb)
    from pg_indexes where schemaname in (${schemaList})),
  'functions',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',n.nspname,'signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),
    'security_definer',p.prosecdef
  ) order by n.nspname,p.oid::regprocedure::text),'[]'::jsonb)
    from pg_proc p join selected_schemas n on n.oid=p.pronamespace where p.prokind in ('f','p')),
  'triggers',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',n.nspname,'table',c.relname,'name',t.tgname,'definition',pg_get_triggerdef(t.oid,true)
  ) order by n.nspname,c.relname,t.tgname),'[]'::jsonb)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
    join selected_schemas n on n.oid=c.relnamespace where not t.tgisinternal),
  'policies',(select coalesce(jsonb_agg(to_jsonb(p) order by p.schemaname,p.tablename,p.policyname),'[]'::jsonb)
    from pg_policies p where p.schemaname in (${schemaList})),
  'extensions',(select coalesce(jsonb_agg(jsonb_build_object(
    'name',e.extname,'version',e.extversion,'schema',n.nspname
  ) order by e.extname),'[]'::jsonb) from pg_extension e join pg_namespace n on n.oid=e.extnamespace),
  'sequences',(select coalesce(jsonb_agg(jsonb_build_object(
    'schema',schemaname,'name',sequencename,'data_type',data_type,
    'start_value',start_value,'min_value',min_value,'max_value',max_value,'increment_by',increment_by,
    'cycle',cycle,'cache_size',cache_size,'last_value',last_value
  ) order by schemaname,sequencename),'[]'::jsonb) from pg_sequences where schemaname in (${schemaList}))
)::text;`;
}

async function main() {
  await requirePostgresTools("psql");
  const source = requireDatabaseUrl("SOURCE_DATABASE_URL");
  const schemas = selectedSchemas();
  const directory = await createRunDirectory("inventory");
  const raw = await run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-At", "-c", sql(schemas)], {
    env: postgresEnvironment(source),
    capture: true,
  });
  const inventory = JSON.parse(raw.trim());
  inventory.source = publicDatabaseIdentity(source);
  const output = join(directory, "catalog.json");
  await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(`Inventario guardado en ${output}`);
  console.log(`Esquemas: ${schemas.join(", ")}. No se exportaron filas ni secretos.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

