import { timingSafeEqual } from "node:crypto";

import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const tables = [
  "ebook_purchases",
  "ebook_cupos",
  "ebook_pending_orders",
  "discount_codes",
  "ebook_waitlist",
] as const;

type TableName = (typeof tables)[number];

function isAuthorized(request: Request) {
  const expected = process.env.EBOOK_MIGRATION_INVENTORY_SECRET;
  const received = request.headers.get("x-migration-inventory-secret");
  if (!expected || !received) return false;

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

function columnsFromRow(row: unknown) {
  if (!row || typeof row !== "object" || Array.isArray(row)) return [];
  return Object.keys(row as Record<string, unknown>).sort();
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const tableResults = await Promise.all(
    tables.map(async (table: TableName) => {
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(1);

      return [
        table,
        error
          ? { exists: false, count: null, columns: [], error: error.code ?? "query_failed" }
          : { exists: true, count: count ?? 0, columns: columnsFromRow(data?.[0]) },
      ] as const;
    }),
  );

  const { data: objects, error: storageError } = await supabase.storage
    .from("ebooks")
    .list("", { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });

  const schemaResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
      accept: "application/openapi+json",
    },
  });
  const schemaDocument = (await schemaResponse.json().catch(() => null)) as {
    definitions?: Record<string, { properties?: Record<string, unknown>; required?: string[] }>;
    components?: { schemas?: Record<string, { properties?: Record<string, unknown>; required?: string[] }> };
  } | null;
  const schemas = schemaDocument?.definitions ?? schemaDocument?.components?.schemas ?? {};
  const schema = Object.fromEntries(
    tables.map((table) => {
      const definition = schemas[table];
      return [
        table,
        definition
          ? { columns: definition.properties ?? {}, required: definition.required ?? [] }
          : null,
      ];
    }),
  );

  return Response.json(
    {
      generated_at: new Date().toISOString(),
      tables: Object.fromEntries(tableResults),
      schema,
      storage: storageError
        ? { exists: false, object_count: null, objects: [], error: storageError.message }
        : {
            exists: true,
            object_count: objects?.length ?? 0,
            objects: (objects ?? []).map(({ name, metadata }) => ({
              name,
              size: metadata?.size ?? null,
              mimetype: metadata?.mimetype ?? null,
            })),
          },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
