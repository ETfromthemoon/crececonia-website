import { getSupabaseAdmin } from "./supabase";
import { getCatalogEntry } from "./ebook-catalog";

export type Tier = "super-early" | "early" | "regular";

export interface PriceInfo {
  price: number;
  tier: Tier;
  remaining: number | null;
  originalPrice: number;
}

function getActiveEntryOrThrow(resource: string) {
  const entry = getCatalogEntry(resource);
  if (!entry || !entry.active) {
    throw new Error(`Recurso no comprable: ${resource}`);
  }
  return entry;
}

export async function getCurrentPrice(resource: string): Promise<PriceInfo> {
  const entry = getActiveEntryOrThrow(resource);
  const db = getSupabaseAdmin();
  const { data } = await db.from("ebook_cupos").select("*").eq("resource", resource);
  const cupos: Record<string, { total: number; used: number }> =
    Object.fromEntries((data ?? []).map((r) => [r.tier, r]));

  const superEarlyLeft =
    (cupos["super-early"]?.total ?? 0) - (cupos["super-early"]?.used ?? 0);
  if (superEarlyLeft > 0) {
    return {
      price: entry.tierPrices.superEarly,
      tier: "super-early",
      remaining: superEarlyLeft,
      originalPrice: entry.tierPrices.regular,
    };
  }

  const earlyLeft = (cupos["early"]?.total ?? 0) - (cupos["early"]?.used ?? 0);
  if (earlyLeft > 0) {
    return {
      price: entry.tierPrices.early,
      tier: "early",
      remaining: earlyLeft,
      originalPrice: entry.tierPrices.regular,
    };
  }

  return {
    price: entry.tierPrices.regular,
    tier: "regular",
    remaining: null,
    originalPrice: entry.tierPrices.regular,
  };
}

export function determineTier(amount: number, resource: string): Tier {
  const entry = getActiveEntryOrThrow(resource);
  if (amount <= entry.tierPrices.superEarly) return "super-early";
  if (amount <= entry.tierPrices.early) return "early";
  return "regular";
}

/**
 * Incrementa el contador de cupos usados del (resource, tier), de forma
 * atómica.
 *
 * Antes esto leía `used` y después escribía `used + 1` en dos queries
 * separadas. supabase-js no lanza excepción cuando una query falla (retorna
 * `{ data, error }`), así que si el SELECT fallaba por un timeout o por
 * contención, `data` quedaba en null y el UPDATE escribía `used = 1` — es
 * decir, borraba el conteo real (podían ser 40 ventas) y reabría un tier con
 * 60% de descuento.
 *
 * Ahora el incremento es una sola sentencia SQL (`used = used + 1`) dentro de
 * una función de Postgres, y si falla lanzamos en vez de escribir un valor
 * absoluto: preferimos quedarnos cortos en el conteo antes que corromperlo.
 */
export async function decrementCupo(resource: string, tier: Tier): Promise<void> {
  if (tier === "regular") return;
  const db = getSupabaseAdmin();
  const { error } = await db.rpc("increment_cupo_used", { p_resource: resource, p_tier: tier });
  if (error) {
    throw new Error(`No se pudo incrementar el cupo de ${resource}/${tier}: ${error.message}`);
  }
}

/**
 * Ventas que NO están registradas como filas en ebook_purchases (ventas
 * previas a que existiera este sistema de checkout).
 *
 * Calibrado para que el total mostrado sea 66 al momento de configurarlo
 * (2026-07-26), cuando ebook_purchases tenía 7 filas: 59 + 7 = 66. Cada
 * compra nueva confirmada por Flow suma 1 desde ahí (67, 68, ...).
 *
 * Si alguna vez borrás filas de ebook_purchases el total mostrado baja —
 * ajustá este número si eso pasa. Cuenta filas, no órdenes: un combo de 3
 * libros suma 3, no 1 (ver spec del motor de bundles).
 */
const UNRECORDED_SOLD_OFFSET = 59;

export async function getEbookSoldCount(): Promise<number> {
  const db = getSupabaseAdmin();
  const { count } = await db
    .from("ebook_purchases")
    .select("id", { count: "exact", head: true });
  return UNRECORDED_SOLD_OFFSET + (count ?? 0);
}
