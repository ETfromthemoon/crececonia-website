import { NextResponse } from "next/server";
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

function authorized(request: Request) {
  const expected = process.env.EBOOK_MIGRATION_INVENTORY_SECRET;
  const received = request.headers.get("x-migration-inventory-secret");
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

function migrationHeaders() {
  const destination = process.env.CORE_EBOOK_IMPORT_URL;
  const secret = process.env.CORE_EBOOK_IMPORT_SECRET;
  if (!destination || !secret) return null;
  return { destination, headers: { authorization: `Bearer ${secret}` } };
}

async function sha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const migration = migrationHeaders();
  if (!migration) return NextResponse.json({ error: "migration_not_configured" }, { status: 503 });

  const supabase = getSupabaseAdmin();
  const rows: Partial<Record<TableName, unknown[]>> = {};
  const sourceCounts: Partial<Record<TableName, number>> = {};

  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select("*", { count: "exact" }).limit(1000);
    if (error) return NextResponse.json({ error: "source_read_failed", table }, { status: 502 });
    rows[table] = data ?? [];
    sourceCounts[table] = count ?? 0;
  }

  const importRows = await fetch(migration.destination, {
    method: "POST",
    headers: { ...migration.headers, "content-type": "application/json" },
    body: JSON.stringify(rows),
    cache: "no-store",
  });
  if (!importRows.ok) return NextResponse.json({ error: "destination_row_import_failed" }, { status: 502 });

  const { data: files, error: listError } = await supabase.storage
    .from("ebooks")
    .list("", { limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } });
  if (listError) return NextResponse.json({ error: "source_storage_list_failed" }, { status: 502 });

  const copiedFiles: Array<{ name: string; size: number; sha256: string }> = [];
  for (const file of files ?? []) {
    if (!/^[a-z0-9-]+\.pdf$/.test(file.name)) {
      return NextResponse.json({ error: "unexpected_storage_object", name: file.name }, { status: 422 });
    }
    const { data: blob, error: downloadError } = await supabase.storage.from("ebooks").download(file.name);
    if (downloadError || !blob) return NextResponse.json({ error: "source_storage_download_failed", name: file.name }, { status: 502 });

    const bytes = await blob.arrayBuffer();
    const sourceHash = await sha256(bytes);
    const destination = await fetch(migration.destination, {
      method: "POST",
      headers: {
        ...migration.headers,
        "content-type": "application/pdf",
        "x-legacy-file-name": file.name,
      },
      body: bytes,
      cache: "no-store",
    });
    const imported = (await destination.json().catch(() => null)) as { sha256?: string } | null;
    if (!destination.ok || imported?.sha256 !== sourceHash) {
      return NextResponse.json({ error: "destination_file_import_failed", name: file.name }, { status: 502 });
    }
    copiedFiles.push({ name: file.name, size: bytes.byteLength, sha256: sourceHash });
  }

  return NextResponse.json(
    {
      source_counts: sourceCounts,
      imported_rows: await importRows.json(),
      files: copiedFiles,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

