import { getSupabaseAdmin } from "./supabase";

export type Tier = "super-early" | "early" | "regular";

export interface PriceInfo {
  price: number;
  tier: Tier;
  remaining: number | null;
  originalPrice: number;
}

export async function getCurrentPrice(): Promise<PriceInfo> {
  const db = getSupabaseAdmin();
  const { data } = await db.from("ebook_cupos").select("*");
  const cupos: Record<string, { total: number; used: number }> =
    Object.fromEntries((data ?? []).map((r) => [r.tier, r]));

  const superEarlyLeft =
    (cupos["super-early"]?.total ?? 0) - (cupos["super-early"]?.used ?? 0);
  if (superEarlyLeft > 0) {
    return {
      price: 10800,
      tier: "super-early",
      remaining: superEarlyLeft,
      originalPrice: 27000,
    };
  }

  const earlyLeft =
    (cupos["early"]?.total ?? 0) - (cupos["early"]?.used ?? 0);
  if (earlyLeft > 0) {
    return {
      price: 17900,
      tier: "early",
      remaining: earlyLeft,
      originalPrice: 27000,
    };
  }

  return { price: 27000, tier: "regular", remaining: null, originalPrice: 27000 };
}

export function determineTier(amount: number): Tier {
  if (amount <= 10800) return "super-early";
  if (amount <= 17900) return "early";
  return "regular";
}

/**
 * Incrementa el contador de cupos usados del tier, de forma atómica.
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
export async function decrementCupo(tier: Tier): Promise<void> {
  if (tier === "regular") return;
  const db = getSupabaseAdmin();
  const { error } = await db.rpc("increment_cupo_used", { p_tier: tier });
  if (error) {
    throw new Error(`No se pudo incrementar el cupo de ${tier}: ${error.message}`);
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
 * ajustá este número si eso pasa.
 */
const UNRECORDED_SOLD_OFFSET = 59;

export async function getEbookSoldCount(): Promise<number> {
  const db = getSupabaseAdmin();
  const { count } = await db
    .from("ebook_purchases")
    .select("id", { count: "exact", head: true });
  return UNRECORDED_SOLD_OFFSET + (count ?? 0);
}
