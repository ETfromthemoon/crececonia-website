import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase";

export type DiscountType = "percent" | "fixed";

export interface DiscountCode {
  code: string;
  type: DiscountType;
  amount: number;
  max_uses: number | null; // null = ilimitado
  used_count: number;
  expires_at: string | null; // null = sin vencimiento
  active: boolean;
}

export type DiscountValidation =
  | { valid: true; code: string; type: DiscountType; amount: number; finalPrice: number }
  | { valid: false; reason: string };

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I para evitar ambigüedad
const MIN_PRICE_CLP = 1000;
const MAX_PREFIX_LENGTH = 10;

function randomCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return out;
}

function sanitizePrefix(prefix: string): string {
  return prefix
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, MAX_PREFIX_LENGTH);
}

/**
 * Genera `quantity` códigos únicos e inserta las filas en discount_codes.
 * `maxUses: null` → el código no tiene límite de usos. `expiresAt: null` →
 * el código no vence. Requiere que la tabla exista (ver SQL en el PR).
 */
export async function generateDiscountCodes(params: {
  type: DiscountType;
  amount: number;
  quantity: number;
  expiresAt: string | null;
  maxUses: number | null;
  prefix?: string;
}): Promise<string[]> {
  const { type, amount, quantity, expiresAt, maxUses, prefix } = params;
  const db = getSupabaseAdmin();
  const cleanPrefix = prefix ? sanitizePrefix(prefix) : "";
  const codes = Array.from({ length: quantity }, () => {
    const raw = randomCode();
    return cleanPrefix ? `${cleanPrefix}-${raw}` : raw;
  });

  const { error } = await db.from("discount_codes").insert(
    codes.map((code) => ({
      code,
      type,
      amount,
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt,
      active: true,
    }))
  );

  if (error) throw new Error(error.message);
  return codes;
}

function computeFinalPrice(currentPrice: number, type: DiscountType, amount: number): number {
  const raw =
    type === "percent"
      ? currentPrice * (1 - amount / 100)
      : currentPrice - amount;
  return Math.max(MIN_PRICE_CLP, Math.round(raw));
}

/**
 * Valida un código contra el precio actual. No marca el código como usado —
 * eso ocurre solo al confirmar el pago (ver redeemDiscountCode), igual que
 * decrementCupo() en ebook-pricing.ts, para no quemar códigos en carritos
 * abandonados.
 */
export async function validateDiscountCode(
  rawCode: string,
  currentPrice: number
): Promise<DiscountValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Ingresa un código." };

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return { valid: false, reason: "Código no válido." };

  const row = data as DiscountCode;

  if (!row.active) return { valid: false, reason: "Este código ya no está activo." };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return { valid: false, reason: "Este código venció." };
  }
  if (row.max_uses !== null && row.used_count >= row.max_uses) {
    return { valid: false, reason: "Este código ya alcanzó su límite de usos." };
  }

  return {
    valid: true,
    code,
    type: row.type,
    amount: row.amount,
    finalPrice: computeFinalPrice(currentPrice, row.type, row.amount),
  };
}

/**
 * Marca un código como usado. Se llama únicamente desde el webhook de
 * confirmación de pago (payment.status === 2), nunca al crear la orden.
 * Si el código no existe, no hace nada — el pago ya se cobró con el monto
 * correcto, esto es solo el registro de uso.
 */
export async function redeemDiscountCode(rawCode: string): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("discount_codes")
    .select("used_count")
    .eq("code", code)
    .maybeSingle();
  if (!data) return;
  await db
    .from("discount_codes")
    .update({ used_count: data.used_count + 1 })
    .eq("code", code);
}
