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
 *   2. Si no hay filas: preguntarle a Flow el commerceOrder de ese token y
 *      leer `ebook_pending_orders`, que se escribe ANTES de mandar a pagar.
 * Si ninguno resuelve, devuelve [] y la página muestra un estado de espera
 * en vez de adivinar un libro.
 */
export async function getPurchasedBooksByToken(token: string): Promise<PurchasedBook[]> {
  const db = getSupabaseAdmin();

  const { data: purchases } = await db
    .from("ebook_purchases")
    .select("resource")
    .eq("flow_token", token);

  if (purchases && purchases.length > 0) {
    return withTitles(purchases.map((row) => row.resource));
  }

  // Fallback: Flow redirige y confirma en paralelo. Solo se usa el manifiesto
  // pendiente si Flow confirma que el pago está acreditado; antes se podía
  // mostrar una descarga a partir de un token que aún no estaba pagado.
  try {
    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;
    if (!apiKey || !secretKey) return [];

    const params = { apiKey, token };
    const s = flowSign(params, secretKey);
    const res = await fetch(
      `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`
    );
    if (!res.ok) return [];

    const payment = await res.json();
    if (payment?.status !== 2) return [];
    const commerceOrder: string | undefined = payment?.commerceOrder;
    if (!commerceOrder) return [];

    const { data: pending } = await db
      .from("ebook_pending_orders")
      .select("resources")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    const resources: { resource: string }[] = pending?.resources ?? [];
    return withTitles(resources.map((r) => r.resource));
  } catch (err) {
    console.error(`[ebook] no se pudo resolver los libros del token ${token}:`, err);
    return [];
  }
}
