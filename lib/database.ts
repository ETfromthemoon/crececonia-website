import "server-only";
import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export async function queryDatabase<T extends Record<string, unknown>>(text: string, values: unknown[] = []): Promise<T[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL no está configurada.");
  client ??= neon(connectionString);
  const result = await client.query(text, values, { fullResults: true });
  return (result.rows ?? []) as T[];
}
