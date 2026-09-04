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

type Fingerprint = { table: string; rows: number; checksum: string };

function quote(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error(`Identificador inválido: ${value}`);
  return `"${value}"`;
}

async function tables(url: URL, schemas: string[]): Promise<string[]> {
  const schemaList = schemas.map((schema) => `'${schema}'`).join(",");
  const output = await run("psql", [
    "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c",
    `select n.nspname||'.'||c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in (${schemaList}) and c.relkind in ('r','p') order by 1;`,
  ], { env: postgresEnvironment(url), capture: true });
  return output.trim().split(/\r?\n/).filter(Boolean);
}

async function fingerprint(url: URL, table: string): Promise<Fingerprint> {
  const [schema, name] = table.split(".");
  const relation = `${quote(schema)}.${quote(name)}`;
  const query = `select count(*)::bigint,md5(coalesce(string_agg(row_hash,'' order by row_hash),'')) from (select md5(to_jsonb(t)::text) row_hash from ${relation} t) rows;`;
  const output = await run("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", query], {
    env: postgresEnvironment(url),
    capture: true,
  });
  const [count, checksum] = output.trim().split("\t");
  return { table, rows: Number(count), checksum };
}

async function main() {
  await requirePostgresTools("psql");
  const source = requireDatabaseUrl("SOURCE_DATABASE_URL");
  const target = requireDatabaseUrl("TARGET_DATABASE_URL");
  if (source.hostname === target.hostname && source.pathname === target.pathname) {
    throw new Error("Origen y destino parecen ser la misma base.");
  }
  const schemas = selectedSchemas();
  const [sourceTables, targetTables] = await Promise.all([tables(source, schemas), tables(target, schemas)]);
  const allTables = Array.from(new Set([...sourceTables, ...targetTables])).sort();
  const sourceSet = new Set(sourceTables);
  const targetSet = new Set(targetTables);
  const comparisons = [];
  for (const table of allTables) {
    const [sourcePrint, targetPrint] = await Promise.all([
      sourceSet.has(table) ? fingerprint(source, table) : null,
      targetSet.has(table) ? fingerprint(target, table) : null,
    ]);
    comparisons.push({
      table,
      source: sourcePrint,
      target: targetPrint,
      match: Boolean(sourcePrint && targetPrint && sourcePrint.rows === targetPrint.rows && sourcePrint.checksum === targetPrint.checksum),
    });
  }
  const mismatches = comparisons.filter((item) => !item.match);
  const report = {
    generated_at: new Date().toISOString(),
    source: publicDatabaseIdentity(source),
    target: publicDatabaseIdentity(target),
    schemas,
    matched: comparisons.length - mismatches.length,
    mismatched: mismatches.length,
    comparisons,
  };
  const directory = await createRunDirectory("reconciliation");
  const output = join(directory, "report.json");
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(`Reconciliación guardada en ${output}: ${report.matched}/${comparisons.length} tablas coinciden.`);
  if (mismatches.length > 0) {
    console.error(`Diferencias: ${mismatches.map((item) => item.table).join(", ")}`);
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

