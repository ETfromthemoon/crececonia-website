import "server-only";
import { requireAdminSession } from "./admin-auth";
import { queryDatabase } from "./database";
import { getCatalogEntry } from "./ebook-catalog";

const PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Cursor = { time: string; id: string };
export class InvalidDeliveryQuery extends Error {}
export type DeliveryIncident = { kind: "cupo" | "discount" | "delivery"; resource: string | null; reason: string };
export type DeliverySummary = {
  id: string; flowOrder: string; createdAt: string; status: string; attempts: number;
  firstAttemptAt: string | null; leaseExpiresAt: string | null; nextAttemptAt: string | null;
  providerAcceptedAt: string | null; reason: string | null; receiptRecorded: boolean | null;
  effectsApplied: number | null; effectsReview: number | null;
  incidents: DeliveryIncident[];
};
export type DeliveryInbox = { rows: DeliverySummary[]; nextCursor: string | null;
  schema: "absent" | "partial" | "complete"; now: number };
type DbRow = Record<string, unknown> & {
  id: string; flow_order: string; created_at: string; status: string; attempts: number;
  first_attempt_at: Date | string | null; lease_expires_at: Date | string | null;
  next_attempt_at: Date | string | null; provider_accepted_at: Date | string | null;
  last_error_code: string | null; receipt_recorded: boolean | null;
  effects_applied: number | null; effects_review: number | null;
  incidents: unknown;
};

export function parseDeliveryCursor(value?: string): Cursor | null {
  if (!value) return null;
  try {
    if (value.length > 200 || !/^[\w-]+$/.test(value)) throw new Error();
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.time !== "string" || !UUID.test(parsed.id)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(parsed.time)
      || !Number.isFinite(Date.parse(parsed.time))
      || new Date(parsed.time).toISOString().slice(0, 19) !== parsed.time.slice(0, 19)) throw new Error();
    return { time: parsed.time, id: parsed.id };
  } catch { throw new InvalidDeliveryQuery("Paginación inválida."); }
}

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  if (!(value instanceof Date) && typeof value !== "string") throw new Error("Invalid timestamp");
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid timestamp");
  return date.toISOString();
}

export async function loadEbookDeliveryInbox(params: { cursor?: string }): Promise<DeliveryInbox> {
  await requireAdminSession();
  const cursor = parseDeliveryCursor(params.cursor);
  const [schema] = await queryDatabase<{ jobs: boolean; receipts: boolean; effects: boolean; now: Date | string }>(
    `select to_regclass('commerce.ebook_delivery_jobs') is not null as jobs,
      to_regclass('commerce.ebook_payment_finalizations') is not null as receipts,
      to_regclass('commerce.ebook_payment_effects') is not null as effects, clock_timestamp() as now`,
  );
  if (!schema || [schema.jobs, schema.receipts, schema.effects].some((value) => typeof value !== "boolean")) throw new Error("Missing schema status");
  const now = Date.parse(iso(schema.now)!);
  const state = schema.jobs && schema.receipts && schema.effects ? "complete"
    : !schema.jobs && !schema.receipts && !schema.effects ? "absent" : "partial";
  if (!schema.jobs) return { rows: [], nextCursor: null, schema: state, now };
  const accounting = schema.receipts && schema.effects;
  const fields = accounting ? `exists (select 1 from commerce.ebook_payment_finalizations r where r.job_id = j.id) as receipt_recorded,
      (select count(*)::integer from commerce.ebook_payment_effects e where e.flow_order = j.flow_order and e.kind in ('cupo', 'discount') and e.status = 'applied') as effects_applied,
      (select count(*)::integer from commerce.ebook_payment_effects e where e.flow_order = j.flow_order and e.kind in ('cupo', 'discount') and e.status = 'needs_review') as effects_review,
      coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'resource', e.resource, 'reason', e.reason) order by e.kind, e.resource)
        from commerce.ebook_payment_effects e where e.flow_order = j.flow_order and e.status = 'needs_review'), '[]'::jsonb) as incidents`
    : "null::boolean as receipt_recorded, null::integer as effects_applied, null::integer as effects_review, '[]'::jsonb as incidents";
  // Explicit projection: never select payload, email, download grants or lease tokens.
  const result = await queryDatabase<DbRow>(
    `select j.id, j.flow_order::text as flow_order,
      to_char(j.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as created_at,
      j.status, j.attempts, j.first_attempt_at, j.lease_expires_at, j.next_attempt_at,
      j.provider_accepted_at, j.last_error_code, ${fields}
      from commerce.ebook_delivery_jobs j
      ${cursor ? "where (j.created_at, j.id) < ($1::timestamptz, $2::uuid)" : ""}
      order by j.created_at desc, j.id desc limit ${PAGE_SIZE + 1}`, cursor ? [cursor.time, cursor.id] : [],
  );
  const rows = result.slice(0, PAGE_SIZE).map((row): DeliverySummary => {
    // Validate the exact textual sort key; Date would lose PostgreSQL microseconds.
    try { parseDeliveryCursor(Buffer.from(JSON.stringify({ time: row.created_at, id: row.id })).toString("base64url")); }
    catch { throw new Error("Invalid stored timestamp"); }
    if (!/^[1-9][0-9]*$/.test(row.flow_order) || !Number.isInteger(row.attempts) || row.attempts < 0 || row.attempts > 5) throw new Error("Invalid delivery summary");
    if (accounting && (typeof row.receipt_recorded !== "boolean" || [row.effects_applied, row.effects_review].some((value) => typeof value !== "number" || !Number.isInteger(value) || value < 0))) throw new Error("Invalid accounting summary");
    const status = ["pending", "processing", "provider_accepted", "retry", "needs_review"].includes(row.status) ? row.status : "unknown";
    const reason = ["provider_transient", "provider_rejected", "provider_unknown", "lease_expired", "attempts_exhausted", "idempotency_window_expired"].includes(row.last_error_code ?? "") ? row.last_error_code : null;
    return { id: row.id, flowOrder: row.flow_order, createdAt: row.created_at, status, attempts: row.attempts,
      firstAttemptAt: iso(row.first_attempt_at), leaseExpiresAt: iso(row.lease_expires_at), nextAttemptAt: iso(row.next_attempt_at),
      providerAcceptedAt: iso(row.provider_accepted_at), reason, receiptRecorded: accounting ? row.receipt_recorded : null,
      effectsApplied: accounting ? row.effects_applied : null, effectsReview: accounting ? row.effects_review : null,
      incidents: accounting ? safeIncidents(row.incidents) : [] };
  });
  const last = rows[rows.length - 1];
  return { rows, schema: state, now, nextCursor: result.length > PAGE_SIZE
    ? Buffer.from(JSON.stringify({ time: last.createdAt, id: last.id })).toString("base64url") : null };
}

function safeIncidents(value: unknown): DeliveryIncident[] {
  if (!Array.isArray(value)) throw new Error("Invalid incidents");
  return value.map((item) => {
    if (!item || !["cupo", "discount", "delivery"].includes(item.kind)) throw new Error("Invalid incident kind");
    return { kind: item.kind as DeliveryIncident["kind"],
      resource: item.kind === "cupo" ? getCatalogEntry(item.resource)?.title ?? "Recurso no reconocido" : null,
      reason: Object.hasOwn(incidentReasons, item.reason) ? item.reason : "unknown" };
  });
}
const incidentReasons: Record<string, string> = {
  cupo_unavailable: "Cupo agotado o no disponible; conciliar el tramo vendido.",
  discount_unavailable: "Descuento no canjeable; conciliar el código de la compra.",
  historical_accounting_unknown: "Contabilidad histórica no comprobada; evitar consumir cupo o descuento otra vez.",
  historical_delivery_unknown: "Correo histórico de resultado incierto; verificar aceptación antes de reenviar.",
  recovery_delivery_requires_review: "Entrega recuperada pendiente de revisión; no se envía automáticamente.",
};
export function ebookIncidentDescription(incident: DeliveryIncident): string {
  return incidentReasons[incident.reason] ?? "Incidencia no reconocida; requiere revisión técnica.";
}

export function ebookDeliveryView(row: DeliverySummary, now: number): { label: string; guidance: string } {
  if (row.status === "provider_accepted") return { label: "Aceptado por el proveedor", guidance: "Resend aceptó el correo. No acredita entrega en bandeja ni descarga del ebook." };
  if (!["pending", "retry", "processing", "needs_review"].includes(row.status)) return { label: "Estado no reconocido", guidance: "Revisar el contrato de entrega sin asumir éxito ni reenviar." };
  const expiry = row.leaseExpiresAt ? Date.parse(row.leaseExpiresAt) : NaN;
  const activeLease = row.status === "processing" && expiry > now;
  const windowExpired = row.firstAttemptAt !== null && Date.parse(row.firstAttemptAt) <= now - 23 * 60 * 60 * 1000;
  if (!activeLease && windowExpired) return { label: "Revisión requerida · ventana agotada", guidance: "Pasaron 23 horas desde el primer intento. La aceptación puede ser incierta; no reenviar automáticamente." };
  if (!activeLease && row.attempts >= 5) return { label: "Revisión requerida · intentos agotados", guidance: "Se alcanzaron cinco intentos. Revisar el resultado del proveedor antes de cualquier acción." };
  if (row.status === "needs_review") return { label: "Requiere revisión", guidance: "El trabajo quedó detenido. Puede corresponder a historia o recuperación de resultado ambiguo; no implica correo fallido." };
  if (row.status === "processing") return Number.isFinite(expiry)
    ? activeLease ? { label: "Reserva vigente", guidance: "Un proceso reservó el envío; todavía no confirma aceptación." }
      : { label: row.reason === "provider_unknown" ? "Reserva vencida · resultado incierto" : "Reserva vencida", guidance: "El proceso perdió su reserva. Revisar su resultado antes de asumir un fallo; esta vista no reintenta." }
    : { label: "Reserva inconsistente", guidance: "Falta una fecha válida de vencimiento. Requiere revisión técnica." };
  if (row.reason === "provider_unknown") return { label: "Resultado del proveedor incierto", guidance: "No se confirmó si el proveedor aceptó el correo. Cualquier procesamiento debe conservar la identidad y el contenido originales." };
  return { label: row.status === "retry" ? "Reintento pendiente" : "Pendiente", guidance: "La ejecución depende de la configuración y disponibilidad del worker. No hay una hora de envío garantizada." };
}
