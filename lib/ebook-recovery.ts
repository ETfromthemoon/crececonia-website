import { getCatalogEntry } from "./ebook-catalog";
import { flowSign } from "./flow";

export type RecoveryPayment = {
  flowOrder: number; commerceOrder: string; requestDate: string;
  status: number; amount: string | number; payer?: string;
};
export type RecoveryItem = { resource: string; tier: "super-early" | "early" | "regular"; amount: number };
export type RecoveryPurchase = { flow_order: number; resource: string };
export type RecoveryManifest = { commerce_order: string; resources: unknown; discount_code: string | null };
export type RecoveryPlan =
  | { kind: "ignored" | "registered" }
  | { kind: "review"; reason: string }
  | { kind: "recoverable"; items: RecoveryItem[] };

function isItem(value: unknown): value is RecoveryItem {
  if (!value || typeof value !== "object") return false;
  const item = value as RecoveryItem;
  return typeof item.resource === "string" && Boolean(getCatalogEntry(item.resource)) &&
    ["super-early", "early", "regular"].includes(item.tier) &&
    Number.isSafeInteger(item.amount) && item.amount > 0;
}

/** Nunca deduce el libro ni el tramo a partir del total cobrado. */
export function planEbookRecovery(
  payment: RecoveryPayment, purchases: RecoveryPurchase[], manifest?: RecoveryManifest,
): RecoveryPlan {
  if (payment.status !== 2 || !/^ebook-\d+-[a-z0-9]+$/.test(payment.commerceOrder)) return { kind: "ignored" };
  const existing = new Set(purchases.filter((row) => String(row.flow_order) === String(payment.flowOrder)).map((row) => row.resource));
  if (!manifest) return existing.size ? { kind: "registered" } : { kind: "review", reason: "Pago sin manifiesto: no se puede inferir el producto." };
  const items = manifest.resources;
  if (manifest.commerce_order !== payment.commerceOrder || !Array.isArray(items) || !items.length ||
      !items.every(isItem) || new Set(items.map((item) => item.resource)).size !== items.length ||
      items.reduce((sum, item) => sum + item.amount, 0) !== Number(payment.amount)) {
    return { kind: "review", reason: "Manifiesto inválido o monto distinto al pago." };
  }
  const missing = items.filter((item) => !existing.has(item.resource));
  if (!missing.length) return { kind: "registered" };
  if (manifest.discount_code) return { kind: "review", reason: "Compra con descuento: conciliar el canje antes de recuperar." };
  if (!payment.payer || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.payer)) return { kind: "review", reason: "Flow no devolvió un email válido." };
  return { kind: "recoverable", items: missing };
}

/** Una consulta fallida o incompleta nunca equivale a cero ventas. */
export async function listPaidFlowPaymentsForDay(
  base: string, apiKey: string, secretKey: string, date: string,
): Promise<RecoveryPayment[]> {
  const payments: RecoveryPayment[] = [];
  const limit = 100;
  for (let start = 0; ; start += limit) {
    const params = { apiKey, date, start, limit };
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
    query.set("s", flowSign(params, secretKey));
    // No incluir la URL firmada ni el cuerpo del proveedor en errores/logs.
    let response: Response;
    try {
      response = await fetch(`${base}/payment/getPayments?${query}`, { signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new Error(`No se pudo consultar Flow el ${date}, página ${start / limit + 1}.`);
    }
    if (!response.ok) throw new Error(`Flow respondió HTTP ${response.status} el ${date}, página ${start / limit + 1}.`);
    const body = await response.json().catch(() => null);
    if (!Array.isArray(body?.data) || ![0, 1].includes(body.hasMore) ||
        (body.hasMore === 1 && body.data.length === 0) ||
        !body.data.every((item: RecoveryPayment) => item && Number.isSafeInteger(item.flowOrder) &&
          typeof item.commerceOrder === "string" && typeof item.status === "number")) {
      throw new Error(`Respuesta de Flow incompleta el ${date}, página ${start / limit + 1}.`);
    }
    payments.push(...body.data.filter((item: RecoveryPayment) => item.status === 2));
    if (body.hasMore === 0) return payments;
  }
}
