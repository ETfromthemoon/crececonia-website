import "server-only";
import { queryDatabase } from "./database";

/** Frozen Resend request. Rebuild neither links nor copy during a retry. */
export type EbookDeliveryPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

export type EbookDeliveryClaim = {
  jobId: string;
  flowOrder: string;
  commerceOrder: string;
  payload: EbookDeliveryPayload;
  idempotencyKey: string;
  leaseToken: string;
  leaseExpiresAt: string;
  attempts: number;
  firstAttemptAt: string;
};

export type EbookDeliveryFailure = "provider_transient" | "provider_rejected" | "provider_unknown";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BIGINT = BigInt("9223372036854775807");

function uuid(value: string): void {
  if (!UUID.test(value)) throw new Error("Identificador de entrega inválido.");
}

function timestamp(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(typeof value === "string" ? value : NaN);
  if (!Number.isFinite(date.getTime())) throw new Error("La cola devolvió una concesión de entrega inválida.");
  return date.toISOString();
}

function flowOrder(value: string): void {
  if (!/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > MAX_BIGINT) {
    throw new Error("Orden de entrega inválida.");
  }
}

function payload(value: EbookDeliveryPayload): EbookDeliveryPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !["from", "to", "subject", "html"].includes(key))) {
    throw new Error("Contenido de entrega inválido.");
  }
  const limits = { from: 320, to: 254, subject: 200, html: 500_000 } as const;
  for (const key of Object.keys(limits) as Array<keyof typeof limits>) {
    if (typeof value[key] !== "string" || !value[key].trim() || value[key].length > limits[key]) {
      throw new Error("Contenido de entrega inválido.");
    }
  }
  // Validate without normalizing: changing a payload can break provider idempotency.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.to) || /[\r\n]/.test(value.from + value.subject)) {
    throw new Error("Contenido de entrega inválido.");
  }
  return { from: value.from, to: value.to, subject: value.subject, html: value.html };
}

async function query<T extends Record<string, unknown>>(sql: string, values: unknown[]): Promise<T[]> {
  try {
    return await queryDatabase<T>(sql, values);
  } catch {
    // DB errors may include the recipient, private links or the provider request.
    throw new Error("No se pudo actualizar la cola de entrega de ebooks.");
  }
}

/**
 * Dormant until a payment finalizer invokes the SQL function within its grant
 * transaction. Do not grant purchases and call this helper in separate commits.
 */
export async function enqueueEbookDelivery(input: {
  flowOrder: string;
  commerceOrder: string;
  payload: EbookDeliveryPayload;
}): Promise<{ jobId: string; outcome: "enqueued" | "existing" }> {
  flowOrder(input.flowOrder);
  if (!input.commerceOrder.trim() || input.commerceOrder.length > 200) throw new Error("Orden de entrega inválida.");
  const frozen = payload(input.payload);
  const [row] = await query<{ job_id: string; outcome: string }>(
    "select * from commerce.enqueue_ebook_delivery($1::bigint, $2, $3::jsonb)",
    [input.flowOrder, input.commerceOrder, JSON.stringify(frozen)],
  );
  if (!row || !UUID.test(row.job_id) || !["enqueued", "existing"].includes(row.outcome)) {
    throw new Error("La cola no confirmó el registro de entrega.");
  }
  return { jobId: row.job_id, outcome: row.outcome as "enqueued" | "existing" };
}

export async function claimEbookDeliveries(limit = 10): Promise<EbookDeliveryClaim[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("Límite de entregas inválido.");
  const rows = await query<{
    job_id: string; flow_order: string; commerce_order: string; payload: EbookDeliveryPayload;
    idempotency_key: string; lease_token: string; lease_expires_at: Date | string; attempts: number; first_attempt_at: Date | string;
  }>("select * from commerce.claim_ebook_deliveries($1)", [limit]);
  return rows.map((row) => {
    uuid(row.job_id);
    uuid(row.lease_token);
    flowOrder(row.flow_order);
    if (row.idempotency_key !== `ebook-buyer-delivery/${row.job_id}`
        || !Number.isInteger(row.attempts) || row.attempts < 1 || row.attempts > 5) {
      throw new Error("La cola devolvió una concesión de entrega inválida.");
    }
    return {
      jobId: row.job_id, flowOrder: row.flow_order, commerceOrder: row.commerce_order,
      payload: payload(row.payload), idempotencyKey: row.idempotency_key, leaseToken: row.lease_token,
      leaseExpiresAt: timestamp(row.lease_expires_at), attempts: row.attempts, firstAttemptAt: timestamp(row.first_attempt_at),
    };
  });
}

/** false means the lease is no longer owned; it does not mean the email failed. */
export async function acceptEbookDelivery(jobId: string, leaseToken: string, providerMessageId: string): Promise<boolean> {
  uuid(jobId);
  uuid(leaseToken);
  if (!providerMessageId.trim() || providerMessageId.length > 200) throw new Error("ID del proveedor inválido.");
  const [row] = await query<{ accepted: boolean }>(
    "select commerce.accept_ebook_delivery($1::uuid, $2::uuid, $3) as accepted", [jobId, leaseToken, providerMessageId],
  );
  if (!row || typeof row.accepted !== "boolean") throw new Error("La cola no confirmó el resultado de entrega.");
  return row.accepted;
}

/** Only a fixed code is persisted; never pass provider messages, email or tokens. */
export async function failEbookDelivery(jobId: string, leaseToken: string, failure: EbookDeliveryFailure): Promise<boolean> {
  uuid(jobId);
  uuid(leaseToken);
  const safeCode = ["provider_transient", "provider_rejected", "provider_unknown"].includes(failure) ? failure : "provider_unknown";
  const [row] = await query<{ failed: boolean }>(
    "select commerce.fail_ebook_delivery($1::uuid, $2::uuid, $3) as failed", [jobId, leaseToken, safeCode],
  );
  if (!row || typeof row.failed !== "boolean") throw new Error("La cola no confirmó el resultado de entrega.");
  return row.failed;
}

/** Database clock is authoritative; leave enough time for the bounded HTTP request. */
export async function canSendEbookDelivery(jobId: string, leaseToken: string): Promise<boolean> {
  uuid(jobId); uuid(leaseToken);
  const [row] = await query<{ ready: boolean }>(
    `select exists (select 1 from commerce.ebook_delivery_jobs where id = $1::uuid
      and status = 'processing' and lease_token = $2::uuid
      and lease_expires_at > clock_timestamp() + interval '25 seconds'
      and first_attempt_at > clock_timestamp() - interval '23 hours' + interval '25 seconds') as ready`, [jobId, leaseToken],
  );
  if (typeof row?.ready !== "boolean") throw new Error("La cola no confirmó la concesión.");
  return row.ready;
}

/** Private readback after an uncertain ACK, without exposing payload or recipient. */
export async function wasEbookDeliveryAccepted(jobId: string, providerMessageId: string): Promise<boolean> {
  uuid(jobId);
  const [row] = await query<{ accepted: boolean }>(
    "select exists (select 1 from commerce.ebook_delivery_jobs where id = $1::uuid and status = 'provider_accepted' and provider_message_id = $2) as accepted",
    [jobId, providerMessageId],
  );
  if (typeof row?.accepted !== "boolean") throw new Error("La cola no confirmó la aceptación.");
  return row.accepted;
}
