import { neon } from "@neondatabase/serverless";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type DatabaseError = { message: string; code?: string };
type DatabaseResult = { data: any; error: DatabaseError | null; count?: number | null };
type QueryMode = "select" | "insert" | "update" | "delete";
type Filter = { column: string; value: unknown };

export interface DatabaseAdminClient {
  from(table: string): DatabaseQuery;
  rpc(name: string, args?: Record<string, unknown>): Promise<DatabaseResult>;
  storage: SupabaseClient["storage"];
}

function identifier(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) {
    throw new Error(`Identificador SQL inválido: ${value}`);
  }
  return `"${value}"`;
}

function databaseError(reason: unknown): DatabaseError {
  if (reason && typeof reason === "object") {
    const candidate = reason as { message?: unknown; code?: unknown };
    return {
      message: typeof candidate.message === "string" ? candidate.message : "Error de base de datos.",
      ...(typeof candidate.code === "string" ? { code: candidate.code } : {}),
    };
  }
  return { message: reason instanceof Error ? reason.message : "Error de base de datos." };
}

function normalizeRows(result: unknown): any[] {
  if (!result || typeof result !== "object") return [];
  const full = result as {
    rows?: Array<Record<string, unknown>>;
    fields?: Array<{ name: string; dataTypeID: number }>;
  };
  const bigintColumns = new Set(
    (full.fields ?? []).filter((field) => field.dataTypeID === 20).map((field) => field.name)
  );
  return (full.rows ?? []).map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (bigintColumns.has(key) && typeof value === "string") {
          const parsed = Number(value);
          if (Number.isSafeInteger(parsed)) return [key, parsed];
        }
        return [key, value];
      })
    )
  );
}

export class DatabaseQuery implements PromiseLike<DatabaseResult> {
  private mode: QueryMode = "select";
  private columns = "*";
  private payload: Record<string, unknown> | Array<Record<string, unknown>> | null = null;
  private filters: Filter[] = [];
  private ordering: { column: string; ascending: boolean } | null = null;
  private rowLimit: number | null = null;
  private countMode = false;
  private head = false;

  constructor(
    private readonly run: (text: string, values: unknown[]) => Promise<any[]>,
    private readonly table: string
  ) {
    identifier(table);
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): this {
    this.mode = "select";
    this.columns = columns;
    this.countMode = options?.count === "exact";
    this.head = options?.head === true;
    return this;
  }

  insert(payload: Record<string, unknown> | Array<Record<string, unknown>>): this {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>): this {
    this.mode = "update";
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    identifier(column);
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    identifier(column);
    this.ordering = { column, ascending: options?.ascending !== false };
    return this;
  }

  limit(value: number): this {
    if (!Number.isInteger(value) || value < 0) throw new Error("Límite SQL inválido.");
    this.rowLimit = value;
    return this;
  }

  async maybeSingle(): Promise<DatabaseResult> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = (result.data ?? []) as any[];
    if (rows.length > 1) {
      return { data: null, error: { message: "La consulta devolvió más de una fila.", code: "PGRST116" } };
    }
    return { ...result, data: rows[0] ?? null };
  }

  async single(): Promise<DatabaseResult> {
    const result = await this.execute();
    if (result.error) return result;
    const rows = (result.data ?? []) as any[];
    if (rows.length !== 1) {
      return { data: null, error: { message: "La consulta no devolvió exactamente una fila.", code: "PGRST116" } };
    }
    return { ...result, data: rows[0] };
  }

  then<TResult1 = DatabaseResult, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private where(values: unknown[]): string {
    if (this.filters.length === 0) return "";
    return ` where ${this.filters
      .map((filter) => {
        values.push(filter.value);
        return `${identifier(filter.column)} = $${values.length}`;
      })
      .join(" and ")}`;
  }

  private selectedColumns(): string {
    if (this.columns.trim() === "*") return "*";
    return this.columns.split(",").map((column) => identifier(column.trim())).join(", ");
  }

  private async execute(): Promise<DatabaseResult> {
    try {
      const values: unknown[] = [];
      const table = `public.${identifier(this.table)}`;

      if (this.mode === "select") {
        const where = this.where(values);
        if (this.countMode && this.head) {
          const rows = await this.run(`select count(*)::int as count from ${table}${where}`, values);
          return { data: null, error: null, count: Number(rows[0]?.count ?? 0) };
        }
        const order = this.ordering
          ? ` order by ${identifier(this.ordering.column)} ${this.ordering.ascending ? "asc" : "desc"}`
          : "";
        const limit = this.rowLimit === null ? "" : ` limit ${this.rowLimit}`;
        const rows = await this.run(`select ${this.selectedColumns()} from ${table}${where}${order}${limit}`, values);
        return { data: rows, error: null, ...(this.countMode ? { count: rows.length } : {}) };
      }

      if (this.mode === "insert") {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload ?? {}];
        if (rows.length === 0) return { data: [], error: null };
        const columns = Object.keys(rows[0]);
        if (columns.length === 0) throw new Error("No hay columnas para insertar.");
        for (const row of rows) {
          if (columns.some((column) => !(column in row))) {
            throw new Error("Todas las filas insertadas deben tener las mismas columnas.");
          }
        }
        const tuples = rows.map((row) => {
          const placeholders = columns.map((column) => {
            values.push(row[column]);
            return `$${values.length}`;
          });
          return `(${placeholders.join(", ")})`;
        });
        const data = await this.run(
          `insert into ${table} (${columns.map(identifier).join(", ")}) values ${tuples.join(", ")} returning *`,
          values
        );
        return { data, error: null };
      }

      if (this.mode === "update") {
        const payload = Array.isArray(this.payload) ? this.payload[0] : this.payload;
        const entries = Object.entries(payload ?? {});
        if (entries.length === 0) throw new Error("No hay columnas para actualizar.");
        const set = entries.map(([column, value]) => {
          values.push(value);
          return `${identifier(column)} = $${values.length}`;
        });
        const where = this.where(values);
        if (!where) throw new Error("Se rechazó un UPDATE sin filtros.");
        const data = await this.run(`update ${table} set ${set.join(", ")}${where} returning *`, values);
        return { data, error: null };
      }

      const where = this.where(values);
      if (!where) throw new Error("Se rechazó un DELETE sin filtros.");
      const data = await this.run(`delete from ${table}${where} returning *`, values);
      return { data, error: null };
    } catch (reason) {
      return { data: null, error: databaseError(reason), count: null };
    }
  }
}

class NeonDatabaseAdmin implements DatabaseAdminClient {
  private readonly sql;
  readonly storage: SupabaseClient["storage"];

  constructor(connectionString: string, storageClient: SupabaseClient) {
    this.sql = neon(connectionString);
    this.storage = storageClient.storage;
  }

  private run = async (text: string, values: unknown[]): Promise<any[]> => {
    const result = await this.sql.query(text, values, { fullResults: true });
    return normalizeRows(result);
  };

  from(table: string): DatabaseQuery {
    return new DatabaseQuery(this.run, table);
  }

  async rpc(name: string, args: Record<string, unknown> = {}): Promise<DatabaseResult> {
    try {
      identifier(name);
      const values = Object.values(args);
      const namedArgs = Object.keys(args)
        .map((key, index) => `${identifier(key)} => $${index + 1}`)
        .join(", ");
      const rows = await this.run(`select * from public.${identifier(name)}(${namedArgs})`, values);
      if (rows.length === 1 && Object.keys(rows[0]).length === 1 && name in rows[0]) {
        return { data: rows[0][name], error: null };
      }
      return { data: rows, error: null };
    } catch (reason) {
      return { data: null, error: databaseError(reason) };
    }
  }
}

let admin: SupabaseClient | null = null;

function getStorageClient(): SupabaseClient {
  const url = process.env.SUPABASE_STORAGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Falta configurar Supabase Storage. Define SUPABASE_STORAGE_URL y SUPABASE_STORAGE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Capa de compatibilidad durante la migración.
 *
 * - Sin DATABASE_URL: conserva exactamente el cliente Supabase vigente.
 * - Con DATABASE_URL: tablas y RPC usan PostgreSQL/Neon; Storage permanece en
 *   Supabase hasta que los objetos se migren a una capa S3 compatible.
 *
 * El nombre se mantiene para no romper imports ni mocks existentes.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    const storageClient = getStorageClient();
    admin = process.env.DATABASE_URL
      ? (new NeonDatabaseAdmin(process.env.DATABASE_URL, storageClient) as unknown as SupabaseClient)
      : storageClient;
  }
  return admin;
}
