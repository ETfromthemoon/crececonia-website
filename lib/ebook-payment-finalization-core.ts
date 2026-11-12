
export type FinalizationQuery = <T extends Record<string, unknown>>(sql: string, values: unknown[]) => Promise<T[]>;
import { buildEbookDeliveryPayload, type EbookDownloadGrant } from "./ebook-delivery-email";

export type VerifiedEbookPayment = {
  flowOrder: string;
  commerceOrder: string;
  email: string;
  amount: number;
  token: string;
  source: "webhook" | "recovery";
};
type Item = { resource: string; tier: string; amount: number; analytics_distinct_id?: string; pricing_variant?: string };
type Snapshot = {
  receipt: null | { commerce_order: string; buyer_email: string; paid_amount: number; job_id: string };
  manifest: null | { resources: Item[]; discount_code: string | null };
  purchases: Array<{ id: string; resource: string; email: string; amount: number; tier: string; token: string }>;
};
export type EbookFinalizationResult = { outcome: "finalized" | "existing"; jobId: string; resources?: string[];
  analytics?: { distinctId?: string; pricingVariant?: string; discountCode: string | null } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Webhook and CLI share this flag; neither may fall back after an enabled failure. */
export function isEbookFinalizationEnabled(): boolean {
  return process.env.EBOOK_PAYMENT_FINALIZATION_ENABLED === "true";
}

function validatePayment(payment: VerifiedEbookPayment): void {
  if (!/^[1-9][0-9]{0,18}$/.test(payment.flowOrder) || BigInt(payment.flowOrder) > BigInt("9223372036854775807")
    || !payment.commerceOrder || payment.commerceOrder.length > 200
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.email) || payment.email.length > 254
    || !Number.isSafeInteger(payment.amount) || payment.amount < 1 || payment.amount > 2147483647
    || !payment.token || payment.token.length > 512 || !["webhook", "recovery"].includes(payment.source)) {
    throw new Error("Pago de ebook inválido.");
  }
}

async function query<T extends Record<string, unknown>>(databaseQuery: FinalizationQuery, sql: string, values: unknown[]): Promise<T[]> {
  try { return await databaseQuery<T>(sql, values); }
  catch { throw new Error("No se pudo finalizar la compra de ebooks."); }
}

function result(outcome: "finalized" | "existing", jobId: string): EbookFinalizationResult {
  if (!UUID.test(jobId)) throw new Error("La base no confirmó la finalización.");
  return { outcome, jobId };
}

function grantsForSnapshot(snapshot: Snapshot, payment: VerifiedEbookPayment): EbookDownloadGrant[] {
  const items = snapshot.manifest?.resources;
  if (!Array.isArray(items) || !items.length || items.length > 50 || !Array.isArray(snapshot.purchases)
    || items.some((item) => !item || typeof item.resource !== "string" || !item.resource || item.resource.length > 200
      || !["super-early", "early", "regular"].includes(item.tier) || !Number.isSafeInteger(item.amount) || item.amount <= 0)
    || new Set(items.map((item) => item.resource)).size !== items.length
    || items.reduce((sum, item) => sum + item.amount, 0) !== payment.amount) {
    throw new Error("El pago requiere un manifiesto válido para finalizar.");
  }
  const existing = new Map<string, string>();
  for (const purchase of snapshot.purchases) {
    const item = items.find((candidate) => candidate.resource === purchase.resource);
    if (!item || existing.has(purchase.resource) || purchase.email !== payment.email || purchase.amount !== item.amount
      || purchase.tier !== item.tier || typeof purchase.token !== "string" || !purchase.token) {
      throw new Error("Las compras existentes requieren revisión.");
    }
    existing.set(purchase.resource, purchase.token);
  }
  return items.map((item) => ({ resource: item.resource, token: existing.get(item.resource) ?? payment.token }));
}

/** Caller verifies paid Flow status first. Never accept payer/amount from browser input.
 * A single SQL function commits grants, effects, receipt and job together. Snapshot
 * races retry at most three times; receipt replay avoids rebuilding provider copy.
 */
export async function finalizeEbookPaymentWithQuery(databaseQuery: FinalizationQuery, payment: VerifiedEbookPayment): Promise<EbookFinalizationResult> {
  if (!isEbookFinalizationEnabled()) throw new Error("Finalización de ebooks desactivada.");
  validatePayment(payment);
  for (let attempt = 0; attempt < 3; attempt++) {
    const [row] = await query<{ snapshot: Snapshot }>(databaseQuery,
      "select commerce.read_ebook_finalization($1::bigint, $2) as snapshot", [payment.flowOrder, payment.commerceOrder],
    );
    if (!row?.snapshot) throw new Error("La base no devolvió el estado de la compra.");
    const snapshot = row.snapshot;
    if (snapshot.receipt) {
      if (snapshot.receipt.commerce_order !== payment.commerceOrder || snapshot.receipt.buyer_email !== payment.email
        || snapshot.receipt.paid_amount !== payment.amount) throw new Error("La identidad del pago requiere revisión.");
      return result("existing", snapshot.receipt.job_id);
    }
    const grants = grantsForSnapshot(snapshot, payment);
    const payload = buildEbookDeliveryPayload({ email: payment.email, grants, recovery: payment.source === "recovery" });
    const [finalized] = await query<{ result: { outcome: string; job_id: string } }>(databaseQuery,
      "select commerce.finalize_ebook_payment($1::bigint, $2, $3, $4::integer, $5, $6::jsonb, $7::jsonb, $8) as result",
      [payment.flowOrder, payment.commerceOrder, payment.email, payment.amount, payment.token, JSON.stringify(snapshot), JSON.stringify(payload), payment.source],
    );
    if (finalized?.result?.outcome === "snapshot_changed") continue;
    if (finalized?.result?.outcome === "finalized" || finalized?.result?.outcome === "existing") {
      const confirmed = result(finalized.result.outcome, finalized.result.job_id);
      return confirmed.outcome === "finalized" ? { ...confirmed, resources: grants.map((grant) => grant.resource),
        analytics: { distinctId: snapshot.manifest?.resources.find((item) => typeof item.analytics_distinct_id === "string")?.analytics_distinct_id,
          pricingVariant: snapshot.manifest?.resources.find((item) => typeof item.pricing_variant === "string")?.pricing_variant,
          discountCode: snapshot.manifest?.discount_code ?? null } } : confirmed;
    }
    throw new Error("La base no confirmó la finalización.");
  }
  throw new Error("La compra cambió durante la finalización; debe reintentarse.");
}
