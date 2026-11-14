import "server-only";
import { createHmac } from "node:crypto";
import { requireAdminSession } from "./admin-auth";
import { queryDatabase } from "./database";

const PAGE_SIZE = 25;
const CATEGORIES = [
  "historical_unlinked", "job_without_receipt", "receipt_without_job", "receipt_job_mismatch",
  "delivery_pending", "delivery_needs_review", "provider_accepted", "receipt_without_purchase", "job_without_purchase", "purchase_without_flow_order",
] as const;
export type ReconciliationCategory = typeof CATEGORIES[number];
export type ReconciliationCase = {
  reference: string;
  observedAt: string;
  resourceCount: number;
  category: ReconciliationCategory;
  deliveryStatus: "pending" | "processing" | "provider_accepted" | "retry" | "needs_review" | null;
};
export type EbookReconciliationReport = {
  schema: "unavailable";
  unavailableReason: "purchase_schema_missing" | "durable_schema_absent" | "durable_schema_partial";
  counts: null;
  cases: [];
  hasMore: false;
  now: string;
} | {
  schema: "complete";
  unavailableReason: null;
  counts: Record<ReconciliationCategory, number>;
  cases: ReconciliationCase[];
  hasMore: boolean;
  now: string;
};

type SchemaRow = {
  purchases: boolean; receipts: boolean; jobs: boolean;
  purchaseFlowOrder: boolean; purchasePurchasedAt: boolean; purchaseId: boolean;
  now: Date | string;
};
type QueryRow = {
  counts: unknown;
  cases: unknown;
  has_more: boolean;
};
function iso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid reconciliation timestamp");
  return date.toISOString();
}

function safeCount(value: unknown): number {
  const count = typeof value === "number" ? value : typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid reconciliation count");
  return count;
}

function safeCategory(value: string): ReconciliationCategory {
  if (!(CATEGORIES as readonly string[]).includes(value)) throw new Error("Invalid reconciliation category");
  return value as ReconciliationCategory;
}

function orderReference(flowOrder: string): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET no está configurada.");
  return `ord-${createHmac("sha256", secret).update(`ebook-reconciliation\0${flowOrder}`).digest("hex").slice(0, 16)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function loadEbookReconciliationReport(): Promise<EbookReconciliationReport> {
  await requireAdminSession();
  const [schema] = await queryDatabase<SchemaRow>(
    `select to_regclass('commerce.ebook_purchases') is not null as purchases,
      to_regclass('commerce.ebook_payment_finalizations') is not null as receipts,
      to_regclass('commerce.ebook_delivery_jobs') is not null as jobs,
      exists (select 1 from information_schema.columns where table_schema = 'commerce' and table_name = 'ebook_purchases' and column_name = 'flow_order') as "purchaseFlowOrder",
      exists (select 1 from information_schema.columns where table_schema = 'commerce' and table_name = 'ebook_purchases' and column_name = 'purchased_at') as "purchasePurchasedAt",
      exists (select 1 from information_schema.columns where table_schema = 'commerce' and table_name = 'ebook_purchases' and column_name = 'id') as "purchaseId",
      clock_timestamp() as now`,
  );
  if (!schema || [schema.purchases, schema.receipts, schema.jobs, schema.purchaseFlowOrder,
    schema.purchasePurchasedAt, schema.purchaseId].some((value) => typeof value !== "boolean")) {
    throw new Error("Missing reconciliation schema status");
  }
  const now = iso(schema.now);
  const unavailableReason = !schema.purchases || !schema.purchaseFlowOrder || !schema.purchasePurchasedAt || !schema.purchaseId
    ? "purchase_schema_missing"
    : !schema.receipts && !schema.jobs ? "durable_schema_absent"
      : !schema.receipts || !schema.jobs ? "durable_schema_partial" : null;
  if (unavailableReason) return { schema: "unavailable", unavailableReason, counts: null, cases: [], hasMore: false, now };

  const [result] = await queryDatabase<QueryRow>(
    `with purchase_orders as (
      select flow_order, count(*)::bigint as resource_count, max(purchased_at) as event_at
      from commerce.ebook_purchases where flow_order is not null group by flow_order
    ), all_orders as (
      select flow_order from purchase_orders
      union select flow_order from commerce.ebook_payment_finalizations
      union select flow_order from commerce.ebook_delivery_jobs
    ), classified as (
      select o.flow_order, greatest(p.event_at, r.created_at, j.created_at) as event_at,
        coalesce(p.resource_count, 0)::bigint as resource_count,
        j.status as delivery_status,
        case
          when p.flow_order is null and r.flow_order is not null then 'receipt_without_purchase'
          when p.flow_order is null and j.flow_order is not null then 'job_without_purchase'
          when r.flow_order is null and j.flow_order is null then 'historical_unlinked'
          when r.flow_order is null then 'job_without_receipt'
          when j.flow_order is null then 'receipt_without_job'
          when r.job_id is distinct from j.id then 'receipt_job_mismatch'
          when j.status = 'provider_accepted' then 'provider_accepted'
          when j.status = 'needs_review' then 'delivery_needs_review'
          else 'delivery_pending'
        end as category
      from all_orders o
      left join purchase_orders p on p.flow_order = o.flow_order
      left join commerce.ebook_payment_finalizations r on r.flow_order = o.flow_order
      left join commerce.ebook_delivery_jobs j on j.flow_order = o.flow_order
    ), page as (
      select * from classified order by event_at desc nulls last, flow_order desc limit ${PAGE_SIZE + 1}
    )
    select jsonb_build_object(
      'historical_unlinked', count(*) filter (where category = 'historical_unlinked')::text,
      'job_without_receipt', count(*) filter (where category = 'job_without_receipt')::text,
      'receipt_without_job', count(*) filter (where category = 'receipt_without_job')::text,
      'receipt_job_mismatch', count(*) filter (where category = 'receipt_job_mismatch')::text,
      'delivery_pending', count(*) filter (where category = 'delivery_pending')::text,
      'delivery_needs_review', count(*) filter (where category = 'delivery_needs_review')::text,
      'provider_accepted', count(*) filter (where category = 'provider_accepted')::text,
      'receipt_without_purchase', count(*) filter (where category = 'receipt_without_purchase')::text,
      'job_without_purchase', count(*) filter (where category = 'job_without_purchase')::text,
      'purchase_without_flow_order', (select count(*)::text from commerce.ebook_purchases where flow_order is null)
    ) as counts,
    coalesce((select jsonb_agg(jsonb_build_object('flow_order', flow_order::text,
      'observed_at', to_char(event_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'resource_count', resource_count, 'category', category, 'delivery_status', delivery_status)
      order by event_at desc nulls last, flow_order desc) from page), '[]'::jsonb) as cases,
    (select count(*) > ${PAGE_SIZE} from classified) as has_more
    from classified`,
  );
  if (!result || !isRecord(result.counts) || !Array.isArray(result.cases) || typeof result.has_more !== "boolean") {
    throw new Error("Invalid reconciliation result");
  }
  const rawCounts = result.counts;
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, safeCount(rawCounts[category])])) as Record<ReconciliationCategory, number>;
  const cases = result.cases.slice(0, PAGE_SIZE).map((value): ReconciliationCase => {
    if (!isRecord(value) || typeof value.flow_order !== "string" || !/^[1-9]\d*$/.test(value.flow_order)
      || typeof value.observed_at !== "string" || !Number.isInteger(value.resource_count) || Number(value.resource_count) < 0
      || (value.delivery_status !== null && typeof value.delivery_status !== "string")) throw new Error("Invalid reconciliation case");
    const deliveryStatus = value.delivery_status;
    if (deliveryStatus !== null && !["pending", "processing", "provider_accepted", "retry", "needs_review"].includes(deliveryStatus)) throw new Error("Invalid delivery status");
    return { reference: orderReference(value.flow_order), observedAt: iso(value.observed_at), resourceCount: value.resource_count as number,
      category: safeCategory(value.category as string), deliveryStatus: deliveryStatus as ReconciliationCase["deliveryStatus"] };
  });
  return { schema: "complete", unavailableReason: null, counts, cases, hasMore: result.has_more, now };
}

export function reconciliationLabel(category: ReconciliationCategory): { label: string; guidance: string } {
  switch (category) {
    case "historical_unlinked": return { label: "Sin recibo ni trabajo durable", guidance: "Puede corresponder a una compra atendida por el flujo previo o a una compra reciente procesada antes de activar la finalización durable. No demuestra que falte un correo." };
    case "job_without_receipt": return { label: "Trabajo sin recibo", guidance: "Hay una tarea durable sin recibo de finalización asociado. Revisar antes de tomar acción." };
    case "receipt_without_job": return { label: "Recibo sin trabajo", guidance: "La finalización no tiene un trabajo de entrega asociado. Requiere revisión; no reenviar automáticamente." };
    case "receipt_job_mismatch": return { label: "Recibo y trabajo no coinciden", guidance: "Las referencias internas difieren. Requiere conciliación técnica." };
    case "delivery_pending": return { label: "Entrega en curso o pendiente", guidance: "El trabajo aún no consta como aceptado por el proveedor." };
    case "delivery_needs_review": return { label: "Entrega requiere revisión", guidance: "El trabajo está en cuarentena o revisión manual. No implica por sí solo que el correo haya fallado." };
    case "provider_accepted": return { label: "Aceptado por el proveedor", guidance: "La aceptación no acredita llegada a la bandeja ni descarga del ebook." };
    case "receipt_without_purchase": return { label: "Recibo sin compra", guidance: "El recibo no tiene filas de compra asociadas. Requiere revisión técnica." };
    case "job_without_purchase": return { label: "Trabajo sin compra", guidance: "El trabajo no tiene filas de compra asociadas. Requiere revisión técnica." };
    case "purchase_without_flow_order": return { label: "Compra sin orden Flow", guidance: "No se puede asociar este registro con una orden de pago durable. Requiere revisión técnica." };
  }
}
