import { createHash, timingSafeEqual } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type StorageObject = { bucket: string; path: string };

function authorized(request: Request): boolean {
  const expected = process.env.MIGRATION_EXPORT_SECRET?.trim();
  const provided = request.headers.get("x-migration-key")?.trim();
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

function sourceClient(): SupabaseClient {
  const url = process.env.SUPABASE_STORAGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Storage no está configurado.");
  return createClient(url, key, { auth: { persistSession: false } });
}

function targetClient(): { client: S3Client; bucket: string; prefix: string } {
  const endpoint = process.env.MIGRATION_STORAGE_S3_ENDPOINT?.trim();
  const region = process.env.MIGRATION_STORAGE_S3_REGION?.trim();
  const accessKeyId = process.env.MIGRATION_STORAGE_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.MIGRATION_STORAGE_S3_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.MIGRATION_STORAGE_S3_BUCKET?.trim();
  const prefix = process.env.MIGRATION_STORAGE_S3_PREFIX?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Neon Object Storage no está configurado.");
  }
  return {
    client: new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    }),
    bucket,
    prefix,
  };
}

function validSegment(value: string): boolean {
  return value.length > 0 && value.length <= 1024 && !value.startsWith("/") && !value.includes("..") && !value.includes("\\");
}

function targetKey(prefix: string, bucket: string, path: string): string {
  const namespaced = `${bucket}/${path}`.replace(/\/+/g, "/");
  return prefix ? `${prefix}/${namespaced}` : namespaced;
}

async function listFiles(client: SupabaseClient, bucket: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const entry of data ?? []) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) files.push(...await listFiles(client, bucket, path));
      else files.push(path);
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  return files;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const source = sourceClient();
    const { data: buckets, error } = await source.storage.listBuckets();
    if (error) throw new Error(error.message);
    const objects: StorageObject[] = [];
    for (const bucket of buckets ?? []) {
      for (const path of await listFiles(source, bucket.id)) objects.push({ bucket: bucket.id, path });
    }
    return NextResponse.json({
      buckets: (buckets ?? []).map((bucket) => ({ id: bucket.id, public: bucket.public })),
      objects,
    });
  } catch (reason) {
    console.error("[migration/storage/inventory]", reason);
    return NextResponse.json({ error: "No se pudo inventariar el almacenamiento." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const body = await request.json().catch(() => null) as StorageObject | null;
    if (!body || typeof body.bucket !== "string" || typeof body.path !== "string" ||
      !validSegment(body.bucket) || !validSegment(body.path)) {
      return NextResponse.json({ error: "Objeto inválido." }, { status: 400 });
    }

    const source = sourceClient();
    const { data, error } = await source.storage.from(body.bucket).download(body.path);
    if (error) throw new Error(error.message);
    const bytes = Buffer.from(await data.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const target = targetClient();
    const key = targetKey(target.prefix, body.bucket, body.path);

    await target.client.send(new PutObjectCommand({
      Bucket: target.bucket,
      Key: key,
      Body: bytes,
      ContentType: data.type || "application/octet-stream",
      Metadata: { sha256, "source-bucket": body.bucket, "source-path": body.path },
    }));
    const head = await target.client.send(new HeadObjectCommand({ Bucket: target.bucket, Key: key }));
    if (Number(head.ContentLength) !== bytes.length || head.Metadata?.sha256 !== sha256) {
      throw new Error("La verificación del objeto copiado no coincide.");
    }
    return NextResponse.json({ bucket: body.bucket, path: body.path, bytes: bytes.length, sha256 });
  } catch (reason) {
    console.error("[migration/storage/copy]", reason);
    return NextResponse.json({ error: "No se pudo copiar el objeto." }, { status: 500 });
  }
}
