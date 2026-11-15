import { isAdminRequest } from "@/lib/admin-session";
import { queryDatabase } from "@/lib/database";
import { listPrivateObjects } from "@/lib/private-storage";
import { getMarketplaceFlowHealth } from "@/lib/marketplace-flow-health";
import { getWorkshopEmailHealth } from "@/lib/workshop-email-health";
import { NextResponse } from "next/server";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only operational check. Never includes object names or credentials. */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const result = { database: false, storage_list: false, storage_upload_configured: false };
  try {
    await queryDatabase("select 1 as healthy");
    result.database = true;
  } catch {
    // The response exposes only the failing subsystem.
  }
  result.storage_upload_configured = Boolean(process.env.STORAGE_S3_ENDPOINT && process.env.STORAGE_S3_BUCKET
    && process.env.STORAGE_S3_ACCESS_KEY_ID && process.env.STORAGE_S3_SECRET_ACCESS_KEY);
  try {
    await listPrivateObjects("ebooks", "marketplace/health");
    result.storage_list = true;
  } catch {
    // Listing confirms read access only; PutObject still requires a separate live upload check.
  }
  return NextResponse.json(result, {
    status: result.database && result.storage_list && result.storage_upload_configured ? 200 : 503,
    headers: { "cache-control": "private, no-store" },
  });
}

/** Explicit write/read/delete smoke test; machine credential only. */
export async function POST(request: Request) {
  const expected = process.env.MARKETPLACE_HEALTH_SECRET;
  const supplied = request.headers.get("x-marketplace-health-key");
  if (!expected || expected.length < 32 || !supplied || supplied.length > 4096) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const endpoint = process.env.STORAGE_S3_ENDPOINT?.trim();
  const bucket = process.env.STORAGE_S3_BUCKET?.trim();
  const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY?.trim();
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return NextResponse.json({ storage_roundtrip: false, cleanup: false }, {
      status: 503, headers: { "cache-control": "private, no-store" },
    });
  }

  const prefix = process.env.STORAGE_S3_PREFIX?.trim().replace(/^\/+|\/+$/g, "");
  const key = `${prefix ? `${prefix}/` : ""}ebooks/marketplace/health/${randomUUID()}.bin`;
  const payload = randomBytes(32);
  const client = new S3Client({
    endpoint,
    region: process.env.STORAGE_S3_REGION?.trim() || "auto",
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: process.env.STORAGE_S3_FORCE_PATH_STYLE?.trim().toLowerCase() !== "false",
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
  let roundtrip = false;
  let cleanup = false;
  try {
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: payload, ContentType: "application/octet-stream" }));
    const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const received = response.Body ? Buffer.from(await response.Body.transformToByteArray()) : Buffer.alloc(0);
    roundtrip = received.length === payload.length && timingSafeEqual(received, payload);
  } catch {
    roundtrip = false;
  } finally {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      cleanup = true;
    } catch {
      cleanup = false;
    }
    client.destroy();
  }
  const [flow, email] = await Promise.all([
    getMarketplaceFlowHealth(),
    getWorkshopEmailHealth().then((result) => result.domainReady).catch(() => false),
  ]);
  return NextResponse.json({ storage_roundtrip: roundtrip, cleanup, flow, email_domain: email }, {
    status: roundtrip && cleanup && flow && email ? 200 : 503,
    headers: { "cache-control": "private, no-store" },
  });
}
