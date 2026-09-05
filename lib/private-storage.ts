import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSupabaseAdmin } from "./supabase";

type DownloadResult = { data: Blob | null; error: { message: string } | null };
type StorageResult = { error: { message: string } | null };

let s3: S3Client | null = null;

function s3Configuration() {
  const endpoint = process.env.STORAGE_S3_ENDPOINT?.trim();
  const bucket = process.env.STORAGE_S3_BUCKET?.trim();
  const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY?.trim();
  if (!endpoint && !bucket && !accessKeyId && !secretAccessKey) return null;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("La configuración S3 está incompleta.");
  }
  return {
    endpoint,
    bucket,
    region: process.env.STORAGE_S3_REGION?.trim() || "auto",
    prefix: process.env.STORAGE_S3_PREFIX?.trim().replace(/^\/+|\/+$/g, "") ?? "",
    forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE?.trim().toLowerCase() !== "false",
    credentials: { accessKeyId, secretAccessKey },
  };
}

function objectKey(prefix: string, sourceBucket: string, path: string): string {
  const namespaced = `${sourceBucket}/${path}`.replace(/\/+/g, "/");
  return prefix ? `${prefix}/${namespaced}` : namespaced;
}

function s3Client(configuration: NonNullable<ReturnType<typeof s3Configuration>>): S3Client {
  s3 ??= new S3Client({
    endpoint: configuration.endpoint,
    region: configuration.region,
    credentials: configuration.credentials,
    forcePathStyle: configuration.forcePathStyle,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  return s3;
}

/**
 * Descarga un objeto privado desde la capa configurada.
 *
 * Sin STORAGE_S3_* conserva Supabase Storage. Con STORAGE_S3_* usa un bucket
 * S3-compatible (R2, Neon Object Storage u otro) y mantiene cada bucket de
 * origen como prefijo: ebooks/... y workshop-assets/....
 */
export async function downloadPrivateObject(sourceBucket: string, path: string): Promise<DownloadResult> {
  const configuration = s3Configuration();
  if (!configuration) {
    if (process.env.DATABASE_URL) {
      return { data: null, error: { message: "Neon Object Storage no está configurado." } };
    }
    return getSupabaseAdmin().storage.from(sourceBucket).download(path);
  }

  try {
    const response = await s3Client(configuration).send(new GetObjectCommand({
      Bucket: configuration.bucket,
      Key: objectKey(configuration.prefix, sourceBucket, path),
    }));
    if (!response.Body) return { data: null, error: { message: "El objeto no tiene contenido." } };
    const bytes = await response.Body.transformToByteArray();
    const arrayBuffer = Uint8Array.from(bytes).buffer;
    return {
      data: new Blob([arrayBuffer], { type: response.ContentType ?? "application/octet-stream" }),
      error: null,
    };
  } catch (reason) {
    return {
      data: null,
      error: { message: reason instanceof Error ? reason.message : "No se pudo descargar el objeto." },
    };
  }
}

export async function uploadPrivateObject(
  sourceBucket: string,
  path: string,
  body: Uint8Array,
  contentType: string
): Promise<StorageResult> {
  const configuration = s3Configuration();
  if (!configuration) {
    if (process.env.DATABASE_URL) return { error: { message: "Neon Object Storage no está configurado." } };
    const { error } = await getSupabaseAdmin().storage.from(sourceBucket).upload(path, body, {
      contentType,
      upsert: true,
    });
    return { error };
  }

  try {
    await s3Client(configuration).send(new PutObjectCommand({
      Bucket: configuration.bucket,
      Key: objectKey(configuration.prefix, sourceBucket, path),
      Body: body,
      ContentType: contentType,
    }));
    return { error: null };
  } catch (reason) {
    return { error: { message: reason instanceof Error ? reason.message : "No se pudo subir el objeto." } };
  }
}

export async function listPrivateObjects(sourceBucket: string, prefix = ""): Promise<string[]> {
  const configuration = s3Configuration();
  if (!configuration) {
    if (process.env.DATABASE_URL) throw new Error("Neon Object Storage no está configurado.");
    const { data, error } = await getSupabaseAdmin().storage.from(sourceBucket).list(prefix, { limit: 1000 });
    if (error) throw new Error(error.message);
    return (data ?? []).filter((entry) => entry.id !== null).map((entry) => entry.name);
  }

  const keyPrefix = objectKey(configuration.prefix, sourceBucket, prefix ? `${prefix.replace(/\/+$/, "")}/` : "");
  const names: string[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await s3Client(configuration).send(new ListObjectsV2Command({
      Bucket: configuration.bucket,
      Prefix: keyPrefix,
      ContinuationToken: continuationToken,
    }));
    for (const object of response.Contents ?? []) {
      if (object.Key) names.push(object.Key.slice(keyPrefix.length));
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return names;
}
