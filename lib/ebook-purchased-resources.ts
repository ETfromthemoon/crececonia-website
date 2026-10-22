import { getSupabaseAdmin } from "./supabase";
import { flowSign, getFlowBase } from "./flow";
import { getCatalogEntry } from "./ebook-catalog";

export type PurchasedBook = { resource: string; title: string };

function withTitles(resources: string[]): PurchasedBook[] {
  return Array.from(new Set(resources)).map((resource) => ({
    resource,
    title: getCatalogEntry(resource)?.title ?? resource,
  }));
}

/**
 * Qué libros corresponden a un token de pago de Flow.
 *
 * Existe porque la página de éxito (la PRIMERA pantalla tras pagar) linkeaba
 * a /api/ebook/download sin `resource`, y ese parámetro cae por defecto al
 * libro 1: quien compraba cualquier otro libro terminaba descargando el
 * libro 1 justo después de pagar.
 *
 * Resuelve en dos pasos porque hay una carrera real: Flow redirige al
 * comprador a la página de éxito al mismo tiempo que llama al webhook de
 * confirmación, así que las filas de `ebook_purchases` pueden no existir
 * todavía cuando esta página renderiza.
 *   1. `ebook_purchases` por flow_token — el caso normal, ya confirmado.
 *   2. Consultar a Flow y completar con el manifiesto pendiente de esa orden,
 *      verificando pago y monto. Puede haber filas de sólo parte del combo
 *      mientras el webhook inserta las compras una a una.
 * Una falla de Flow nunca revoca las compras ya registradas.
 * Si ninguno resuelve, devuelve [] sin autorizar una descarga.
 */
export async function getPurchasedBooksByToken(token: string): Promise<PurchasedBook[]> {
  const db = getSupabaseAdmin();

  const { data: purchases } = await db
    .from("ebook_purchases")
    .select("resource")
    .eq("flow_token", token);

  const confirmed = (purchases ?? []).map((row) => row.resource);
  const confirmedBooks = withTitles(confirmed);

  // Fallback: Flow redirige y confirma en paralelo. Solo se usa el manifiesto
  // pendiente si Flow confirma que el pago está acreditado; antes se podía
  // mostrar una descarga a partir de un token que aún no estaba pagado.
  try {
    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;
    if (!apiKey || !secretKey) return confirmedBooks;

    const params = { apiKey, token };
    const s = flowSign(params, secretKey);
    const res = await fetch(
      `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return confirmedBooks;

    const payment = await res.json();
    if (payment?.status !== 2) return confirmedBooks;
    const commerceOrder = payment.commerceOrder;
    if (typeof commerceOrder !== "string" || !commerceOrder) return confirmedBooks;

    const { data: pending } = await db
      .from("ebook_pending_orders")
      .select("resources")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    const resources: unknown = pending?.resources;
    const paidAmount = Number(payment.amount);
    if (!Number.isSafeInteger(paidAmount) || paidAmount <= 0 ||
        !Array.isArray(resources) || resources.length === 0) return confirmedBooks;
    const names: string[] = [];
    let expectedAmount = 0;
    for (const item of resources) {
      if (!item || typeof item.resource !== "string" || !getCatalogEntry(item.resource) ||
          names.includes(item.resource) || !Number.isSafeInteger(item.amount) || item.amount <= 0) {
        return confirmedBooks;
      }
      names.push(item.resource);
      expectedAmount += item.amount;
    }
    if (expectedAmount !== paidAmount) return confirmedBooks;
    return withTitles([...confirmed, ...names]);
  } catch (err) {
    console.error("[ebook] no se pudo completar el manifiesto de libros:", err);
    return confirmedBooks;
  }
}
