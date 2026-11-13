import "server-only";
import { requireAdminSession } from "./admin-auth";
import { queryDatabase } from "./database";

const PAGE_SIZE = 25;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Cursor = { time: string; id: string };
export type QualificationSummary = {
  id: string; service: string; name: string; company: string; created_at: string; status: string;
  sync_status: string | null; attempts: number | null; lease_expires_at: string | null;
  next_attempt_at: string | null; reason_code: string | null;
};
export type QualificationDetail = QualificationSummary & {
  email: string; role: string; result: string; budget: string; availability: string; context: string; decision: string;
};
type DatabaseQualification<T extends QualificationSummary> = Omit<T, "lease_expires_at" | "next_attempt_at"> & {
  lease_expires_at: Date | string | null;
  next_attempt_at: Date | string | null;
};

// Neon parses timestamptz as Date; normalize at the database boundary without
// converting the textual created_at cursor (which retains PostgreSQL microseconds).
function normalizeSyncDates<T extends QualificationSummary>(row: DatabaseQualification<T>): T {
  const iso = (value: Date | string | null) => value instanceof Date ? value.toISOString() : value;
  return { ...row, lease_expires_at: iso(row.lease_expires_at), next_attempt_at: iso(row.next_attempt_at) } as T;
}
export type QualificationInbox = {
  rows: QualificationSummary[]; detail: QualificationDetail | null; detailRequested: boolean;
  nextCursor: string | null; integrationInstalled: boolean; now: number;
};

export class InvalidQualificationQuery extends Error {}

export function encodeQualificationCursor(row: Pick<QualificationSummary, "id" | "created_at">): string {
  return Buffer.from(JSON.stringify({ time: row.created_at, id: row.id })).toString("base64url");
}

export function parseQualificationCursor(value?: string): Cursor | null {
  if (!value) return null;
  try {
    if (value.length > 200 || !/^[\w-]+$/.test(value)) throw new Error();
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.time !== "string" || typeof parsed.id !== "string" || !UUID.test(parsed.id)
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(parsed.time)
      || !Number.isFinite(Date.parse(parsed.time))
      || new Date(parsed.time).toISOString().slice(0, 19) !== parsed.time.slice(0, 19)) throw new Error();
    return { time: parsed.time, id: parsed.id };
  } catch { throw new InvalidQualificationQuery("Paginación inválida."); }
}

const summaryFields = `q.id, q.service, q.payload->>'name' as name, q.payload->>'company' as company,
  to_char(q.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as created_at, q.status`;
function syncFields(installed: boolean) {
  return installed
    ? `j.status as sync_status, j.attempts, j.lease_expires_at, j.next_attempt_at, j.reason_code`
    : `null::text as sync_status, null::integer as attempts, null::timestamptz as lease_expires_at,
       null::timestamptz as next_attempt_at, null::text as reason_code`;
}

export async function loadQualificationInbox(params: { cursor?: string; id?: string }): Promise<QualificationInbox> {
  // Authorization also guards direct server callers; no database work precedes it.
  await requireAdminSession();
  const cursor = parseQualificationCursor(params.cursor);
  if (params.id && !UUID.test(params.id)) throw new InvalidQualificationQuery("Postulación inválida.");
  const [schema] = await queryDatabase<{ installed: boolean }>(
    "select to_regclass('commerce.nitido_sync_jobs') is not null as installed",
  );
  if (typeof schema?.installed !== "boolean") throw new Error("Missing schema status");
  const installed = schema.installed;
  const join = installed ? "left join commerce.nitido_sync_jobs j on j.qualification_id = q.id" : "";
  const values: unknown[] = cursor ? [cursor.time, cursor.id] : [];
  const where = cursor ? "where (q.created_at, q.id) < ($1::timestamptz, $2::uuid)" : "";
  const result = await queryDatabase<DatabaseQualification<QualificationSummary>>(
    `select ${summaryFields}, ${syncFields(installed)} from commerce.service_qualifications q ${join}
     ${where} order by q.created_at desc, q.id desc limit ${PAGE_SIZE + 1}`, values,
  );
  const rows = result.slice(0, PAGE_SIZE).map(normalizeSyncDates<QualificationSummary>);
  let detail: QualificationDetail | null = null;
  if (params.id) {
    const details = await queryDatabase<DatabaseQualification<QualificationDetail>>(
      `select ${summaryFields}, ${syncFields(installed)}, q.email,
       q.payload->>'role' as role, q.payload->>'result' as result, q.payload->>'budget' as budget,
       q.payload->>'availability' as availability, q.payload->>'context' as context, q.payload->>'decision' as decision
       from commerce.service_qualifications q ${join} where q.id = $1::uuid`, [params.id],
    );
    detail = details[0] ? normalizeSyncDates<QualificationDetail>(details[0]) : null;
  }
  return { rows, detail, detailRequested: Boolean(params.id), integrationInstalled: installed,
    nextCursor: result.length > PAGE_SIZE ? encodeQualificationCursor(rows[rows.length - 1]) : null, now: Date.now() };
}

export function qualificationSyncView(row: QualificationSummary, installed: boolean, now: number) {
  if (!installed) return { label: "Integración no instalada", action: "La postulación está guardada. Coordinar la instalación de la sincronización." };
  if (!row.sync_status) return { label: "Sin trabajo de sincronización", action: "Revisar la incorporación de esta postulación a la integración." };
  if (row.sync_status === "synced") return { label: "Sincronizada", action: "Consultar el seguimiento comercial en Nítido; este estado no acredita contacto ni venta." };
  if (row.sync_status === "needs_review") {
    const reasons: Record<string, string> = {
      duplicate_candidate: "Posible duplicado: revisar coincidencias en Nítido.",
      revision_conflict: "Conflicto de revisión: comparar los cambios en Nítido.",
      invalid_payload: "Datos incompatibles: revisar el contrato de integración.",
      lease_exhausted: "Intentos agotados: revisar la integración antes de volver a procesar.",
    };
    return { label: "Requiere revisión", action: reasons[row.reason_code ?? ""] ?? "Revisar el incidente de integración." };
  }
  if (row.sync_status === "leased") {
    const expiry = row.lease_expires_at ? Date.parse(row.lease_expires_at) : NaN;
    if (!Number.isFinite(expiry)) return { label: "Reserva inconsistente", action: "Revisar la integración: falta una fecha de vencimiento válida." };
    if (expiry <= now) return (row.attempts ?? 0) >= 8
      ? { label: "Revisión requerida · intentos agotados", action: "La última reserva venció. Requiere revisión aunque el proceso aún no haya actualizado su estado." }
      : { label: "Reserva vencida", action: "Revisar el proceso de sincronización; un nuevo intento depende de su disponibilidad y programación." };
    return { label: "Reserva vigente", action: "El proceso reservó esta postulación; todavía no hay confirmación de sincronización." };
  }
  if (row.sync_status === "pending") return (row.attempts ?? 0) >= 8
    ? { label: "Revisión requerida · intentos agotados", action: "Revisar la integración: este trabajo pendiente ya alcanzó el límite de intentos." }
    : { label: (row.attempts ?? 0) > 0 ? "Reintento pendiente" : "Pendiente de sincronización", action: "Comprobar la disponibilidad del proceso de integración. Pendiente no significa sin contactar." };
  return { label: "Estado de integración no reconocido", action: "Revisar el contrato de integración sin modificar la postulación." };
}
