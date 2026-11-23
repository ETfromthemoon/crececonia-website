import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { queryDatabase } from "./database";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REASONS = ["duplicate_candidate", "revision_conflict", "invalid_payload"] as const;
type ReviewReason = typeof REASONS[number];
type Ack = { jobId: string; leaseToken: string; outcome: "synced" | "needs_review"; operationId: string | null; reasonCode: ReviewReason | null };

export class SyncRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function syncResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "Vary": "Authorization" } });
}

export function authorizeSync(request: Request) {
  const key = process.env.NITIDO_SYNC_KEY;
  if (!key || key.length < 32) throw new SyncRequestError(503, "Sincronización no configurada.");
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || token.length > 4096 || !timingSafeEqual(
    createHash("sha256").update(token).digest(), createHash("sha256").update(key).digest(),
  )) throw new SyncRequestError(401, "No autorizado.");
}

export async function readSyncBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new SyncRequestError(400, "Solicitud inválida.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2048) {
        await reader.cancel();
        throw new SyncRequestError(413, "Solicitud demasiado extensa.");
      }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyncRequestError) throw error;
    throw new SyncRequestError(400, "Solicitud inválida.");
  } finally { reader.releaseLock(); }
}

function id(value: unknown): value is string { return typeof value === "string" && UUID.test(value); }
function onlyKeys(body: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(body).some((key) => !keys.includes(key))) throw new SyncRequestError(400, "Campos inválidos.");
}

export async function claimNitidoJob(body: Record<string, unknown>) {
  onlyKeys(body, ["workerId", "limit"]);
  if (!id(body.workerId) || body.limit !== 1) throw new SyncRequestError(400, "Solicitud inválida.");
  const jobs = await queryDatabase<{ job: Record<string, unknown> }>(
    "select job from commerce.claim_nitido_sync_job($1::uuid)", [body.workerId],
  );
  return { jobs: jobs.map(({ job }) => job) };
}

function parseAck(body: Record<string, unknown>): Ack {
  onlyKeys(body, ["jobId", "leaseToken", "outcome", "operationId", "reasonCode"]);
  if (!id(body.jobId) || !id(body.leaseToken)) throw new SyncRequestError(400, "Solicitud inválida.");
  if (body.outcome === "synced" && id(body.operationId) && body.reasonCode === undefined) {
    return { jobId: body.jobId, leaseToken: body.leaseToken, outcome: "synced", operationId: body.operationId, reasonCode: null };
  }
  if (body.outcome === "needs_review" && body.operationId === undefined && REASONS.includes(body.reasonCode as ReviewReason)) {
    return { jobId: body.jobId, leaseToken: body.leaseToken, outcome: "needs_review", operationId: null, reasonCode: body.reasonCode as ReviewReason };
  }
  throw new SyncRequestError(400, "Resultado inválido.");
}

export async function acknowledgeNitidoJob(body: Record<string, unknown>) {
  const ack = parseAck(body);
  const rows = await queryDatabase<{ outcome: string }>(
    "select outcome from commerce.ack_nitido_sync_job($1::uuid, $2::uuid, $3, $4::uuid, $5)",
    [ack.jobId, ack.leaseToken, ack.outcome, ack.operationId, ack.reasonCode],
  );
  if (rows[0]?.outcome === "conflict") throw new SyncRequestError(409, "Reserva vencida o resultado incompatible.");
  if (rows[0]?.outcome !== "acknowledged") throw new Error("Missing sync acknowledgment");
  return { ok: true };
}

export async function handleSyncRequest(request: Request, operation: (body: Record<string, unknown>) => Promise<unknown>) {
  try {
    authorizeSync(request);
    return syncResponse(await operation(await readSyncBody(request)));
  } catch (error) {
    if (error instanceof SyncRequestError) return syncResponse({ detail: error.message }, error.status);
    // Never emit SQL, parameters, contact data, authorization or provider errors.
    console.error("[nitido-sync] No se pudo completar la operación.");
    return syncResponse({ detail: "Sincronización temporalmente no disponible." }, 503);
  }
}
