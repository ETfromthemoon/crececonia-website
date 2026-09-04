import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createRunDirectory } from "./common";

type ObjectManifest = { bucket: string; path: string; bytes: number; sha256: string };

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

async function main() {
  const url = process.env.SUPABASE_STORAGE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_STORAGE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan las credenciales de Supabase Storage.");
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw new Error(error.message);
  const directory = await createRunDirectory("storage-export");
  const objects: ObjectManifest[] = [];

  for (const bucket of buckets ?? []) {
    const paths = await listFiles(client, bucket.id);
    for (const path of paths) {
      const { data, error: downloadError } = await client.storage.from(bucket.id).download(path);
      if (downloadError) throw new Error(`${bucket.id}/${path}: ${downloadError.message}`);
      const bytes = Buffer.from(await data.arrayBuffer());
      const target = join(directory, "objects", bucket.id, ...path.split("/"));
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, bytes, { mode: 0o600 });
      objects.push({ bucket: bucket.id, path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    }
  }
  const manifest = {
    created_at: new Date().toISOString(),
    buckets: (buckets ?? []).map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      public: bucket.public,
      file_size_limit: bucket.file_size_limit,
      allowed_mime_types: bucket.allowed_mime_types,
    })),
    objects,
  };
  await writeFile(join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(`Storage exportado en ${directory}: ${objects.length} objetos verificados por SHA-256.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

