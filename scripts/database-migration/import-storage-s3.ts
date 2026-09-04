import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { hasFlag, latestRunDirectory, sha256 } from "./common";

type ManifestObject = { bucket: string; path: string; bytes: number; sha256: string };

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}.`);
  return value;
}

function key(prefix: string, sourceBucket: string, path: string): string {
  const namespaced = `${sourceBucket}/${path}`.replace(/\/+/g, "/");
  return prefix ? `${prefix}/${namespaced}` : namespaced;
}

async function main() {
  if (!hasFlag("--apply")) {
    console.log("Dry-run: no se subió nada. Repite con --apply después de crear y revisar el bucket privado de destino.");
    return;
  }
  const endpoint = required("STORAGE_S3_ENDPOINT");
  const bucket = required("STORAGE_S3_BUCKET");
  const prefix = process.env.STORAGE_S3_PREFIX?.trim().replace(/^\/+|\/+$/g, "") ?? "";
  const directory = process.env.STORAGE_RUN_DIR
    ? resolve(process.env.STORAGE_RUN_DIR)
    : await latestRunDirectory("storage-export");
  const manifestPath = join(directory, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error("No existe el manifiesto de Storage.");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { objects: ManifestObject[] };
  const client = new S3Client({
    endpoint,
    region: process.env.STORAGE_S3_REGION?.trim() || "auto",
    credentials: {
      accessKeyId: required("STORAGE_S3_ACCESS_KEY_ID"),
      secretAccessKey: required("STORAGE_S3_SECRET_ACCESS_KEY"),
    },
    forcePathStyle: true,
  });

  for (const object of manifest.objects) {
    const file = join(directory, "objects", object.bucket, ...object.path.split("/"));
    if (!existsSync(file) || await sha256(file) !== object.sha256) {
      throw new Error(`El archivo local no coincide con el manifiesto: ${object.bucket}/${object.path}`);
    }
    const body = await readFile(file);
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key(prefix, object.bucket, object.path),
      Body: body,
      Metadata: { sha256: createHash("sha256").update(body).digest("hex") },
    }));
    const head = await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: key(prefix, object.bucket, object.path),
    }));
    if (head.ContentLength !== object.bytes || head.Metadata?.sha256 !== object.sha256) {
      throw new Error(`La verificación S3 falló: ${object.bucket}/${object.path}`);
    }
  }
  console.log(`${manifest.objects.length} objetos importados y verificados en el bucket privado de destino.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

