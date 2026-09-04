import { stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  createRunDirectory,
  postgresEnvironment,
  publicDatabaseIdentity,
  requireDatabaseUrl,
  requirePostgresTools,
  run,
  selectedSchemas,
  sha256,
} from "./common";

async function main() {
  await requirePostgresTools("pg_dump");
  const source = requireDatabaseUrl("SOURCE_DATABASE_URL");
  const schemas = selectedSchemas();
  const directory = await createRunDirectory("database-export");
  const archive = join(directory, "database.dump");
  const schemaSql = join(directory, "schema.sql");
  const schemaArgs = schemas.flatMap((schema) => ["--schema", schema]);
  // Neon soporta las extensiones PostgreSQL usadas por la aplicación, pero no
  // los servicios internos pg_net ni supabase_vault. Sus datos/configuración se
  // inventarían por separado y no deben bloquear el dump portable.
  const portableExtensionArgs = [
    "--exclude-extension=pg_net",
    "--exclude-extension=supabase_vault",
  ];
  const env = postgresEnvironment(source);

  await run("pg_dump", [
    "--format=custom",
    "--compress=9",
    "--no-owner",
    "--no-acl",
    "--verbose",
    ...portableExtensionArgs,
    ...schemaArgs,
    "--file",
    archive,
  ], { env });
  await run("pg_dump", [
    "--schema-only",
    "--no-owner",
    "--no-acl",
    ...portableExtensionArgs,
    ...schemaArgs,
    "--file",
    schemaSql,
  ], { env });

  const [archiveStat, schemaStat] = await Promise.all([stat(archive), stat(schemaSql)]);
  const manifest = {
    created_at: new Date().toISOString(),
    source: publicDatabaseIdentity(source),
    schemas,
    files: {
      "database.dump": { bytes: archiveStat.size, sha256: await sha256(archive) },
      "schema.sql": { bytes: schemaStat.size, sha256: await sha256(schemaSql) },
    },
  };
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  console.log(`Exportación consistente guardada en ${directory}`);
  console.log("Los archivos contienen datos de producción y están fuera de Git por .gitignore.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
