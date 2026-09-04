import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSupabaseAdmin } from "./supabase";

type DownloadResult = { data: Blob | null; error: { message: string } | null };

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
    credentials: { accessKeyId, secretAccessKey },
  };
}

function objectKey(prefix: string, sourceBucket: string, path: string): string {
  const namespaced = `${sourceBucket}/${path}`.replace(/\/+/g, "/");
  return prefix ? `${prefix}/${namespaced}` : namespaced;
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
  if (!configuration) return getSupabaseAdmin().storage.from(sourceBucket).download(path);

  try {
    s3 ??= new S3Client({
      endpoint: configuration.endpoint,
      region: configuration.region,
      credentials: configuration.credentials,
      forcePathStyle: true,
    });
    const response = await s3.send(new GetObjectCommand({
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
