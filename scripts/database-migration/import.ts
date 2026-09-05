import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  hasFlag,
  latestRunDirectory,
  postgresEnvironment,
  publicDatabaseIdentity,
  requireDatabaseUrl,
  requirePostgresTools,
  run,
  selectedSchemas,
  sha256,
} from "./common";

async function main() {
  if (!hasFlag("--apply")) {
    console.log("Dry-run: no se importó nada. Repite con --apply después de revisar destino, manifiesto y esquema.");
    return;
  }

  await requirePostgresTools("pg_restore", "psql");
  const target = requireDatabaseUrl("TARGET_DATABASE_URL");
  if (!target.hostname.endsWith(".neon.tech") && !hasFlag("--allow-any-target")) {
    throw new Error("El destino no parece ser Neon. Usa --allow-any-target solo si lo verificaste expresamente.");
  }
  const schemas = selectedSchemas();
  const directory = process.env.MIGRATION_RUN_DIR
    ? resolve(process.env.MIGRATION_RUN_DIR)
    : await latestRunDirectory("database-export");
  const archive = join(directory, "database.dump");
  const restoreList = join(directory, "restore.list");
  const manifestPath = join(directory, "manifest.json");
  if (!existsSync(archive) || !existsSync(manifestPath)) throw new Error("La exportación está incompleta.");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.files?.["database.dump"]?.sha256 !== await sha256(archive)) {
    throw new Error("El hash de database.dump no coincide con el manifiesto.");
  }

  const env = postgresEnvironment(target);
  const schemaList = schemas.map((schema) => `'${schema}'`).join(",");
  const existing = await run("psql", [
    "-X", "-v", "ON_ERROR_STOP=1", "-At", "-c",
    `select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in (${schemaList}) and c.relkind in ('r','p','v','m');`,
  ], { env, capture: true });
  if (Number(existing.trim()) > 0 && !hasFlag("--allow-nonempty")) {
    throw new Error("El destino ya contiene objetos del alcance. No se sobrescribió nada; usa una rama/base vacía.");
  }

  await run("psql", [
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    resolve(process.cwd(), "scripts", "database-migration", "sql", "neon-prelude.sql"),
  ], { env });

  const tableOfContents = await run("pg_restore", ["--list", archive], { capture: true });
  const portableTableOfContents = tableOfContents
    .split(/\r?\n/)
    .map((line) => /^\d+; .* SCHEMA - public\b/.test(line) ? `;${line}` : line)
    .join("\n");
  await writeFile(restoreList, portableTableOfContents, { encoding: "utf8", mode: 0o600 });

  await run("pg_restore", [
    "--dbname",
    decodeURIComponent(target.pathname.replace(/^\//, "")),
    "--exit-on-error",
    "--single-transaction",
    "--no-owner",
    "--no-acl",
    "--verbose",
    "--use-list",
    restoreList,
    archive,
  ], { env });
  console.log(`Importación aplicada en ${JSON.stringify(publicDatabaseIdentity(target))}.`);
  console.log("Supabase no fue modificado. Ejecuta db:reconcile antes de probar la aplicación.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
