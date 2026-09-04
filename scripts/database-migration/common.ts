import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";

export const PRIVATE_ROOT = resolve(process.cwd(), ".migration-private");
export const DEFAULT_SCHEMAS = [
  "agent_memory",
  "auth",
  "automation",
  "carousel_library",
  "commerce",
  "private",
  "public",
] as const;

export function selectedSchemas(): string[] {
  const configured = process.env.MIGRATION_SCHEMAS?.split(",").map((value) => value.trim()).filter(Boolean);
  const schemas = configured?.length ? configured : [...DEFAULT_SCHEMAS];
  for (const schema of schemas) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) throw new Error(`Esquema inválido: ${schema}`);
  }
  return Array.from(new Set(schemas)).sort();
}

export function requireDatabaseUrl(name: "SOURCE_DATABASE_URL" | "TARGET_DATABASE_URL"): URL {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Falta ${name}. No pegues la URL en la terminal: guárdala en .env.local.`);
  const url = new URL(raw);
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${name} debe ser una URL de PostgreSQL.`);
  }
  return url;
}

export function publicDatabaseIdentity(url: URL) {
  return {
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, ""),
    user: url.username,
  };
}

export function postgresEnvironment(url: URL): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: decodeURIComponent(url.pathname.replace(/^\//, "")),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGSSLMODE: url.searchParams.get("sslmode") ?? "require",
    PGCONNECT_TIMEOUT: "15",
  };
}

export function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function createRunDirectory(prefix: string): Promise<string> {
  await mkdir(PRIVATE_ROOT, { recursive: true });
  const directory = resolve(PRIVATE_ROOT, `${prefix}-${timestamp()}`);
  await mkdir(directory, { recursive: false });
  return directory;
}

export async function latestRunDirectory(prefix: string): Promise<string> {
  if (!existsSync(PRIVATE_ROOT)) throw new Error("No existe .migration-private; ejecuta primero la exportación.");
  const entries = (await readdir(PRIVATE_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${prefix}-`))
    .map((entry) => entry.name)
    .sort();
  const latest = entries.at(-1);
  if (!latest) throw new Error(`No hay una ejecución ${prefix} disponible.`);
  return resolve(PRIVATE_ROOT, latest);
}

export async function sha256(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

export async function run(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; capture?: boolean } = {}
): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const child = spawn(command, args, {
      env: options.env ?? process.env,
      shell: false,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr?.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolvePromise(Buffer.concat(stdout).toString("utf8"));
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      reject(new Error(`${command} terminó con código ${code}${detail ? `: ${detail}` : ""}`));
    });
  });
}

export async function requirePostgresTools(...tools: Array<"pg_dump" | "pg_restore" | "psql">) {
  for (const tool of tools) await run(tool, ["--version"], { capture: true });
}

export function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

