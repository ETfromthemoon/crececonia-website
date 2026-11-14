import { createHmac, timingSafeEqual } from "node:crypto";

export const MARKETPLACE_COMMISSION_BPS = 500;
export const MARKETPLACE_VAT_BPS = 1900;
export const MAX_MARKETPLACE_PDF_BYTES = 4 * 1024 * 1024;
export const MARKETPLACE_FLOW_ACCOUNT_REF = "crececonia";

function flowWholeClp(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.0+)?$/.test(value))) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

/** Provider deductions in CLP, only when fee/tax/balance fields reconcile. */
export function marketplaceFlowGatewayFee(
  amount: number,
  paymentData: unknown,
): number | null {
  if (!Number.isSafeInteger(amount) || amount <= 0 || !paymentData || typeof paymentData !== "object") return null;
  const data = paymentData as Record<string, unknown>;
  if (data.currency !== undefined && data.currency !== "CLP") return null;
  const fee = flowWholeClp(data.fee);
  const taxes = data.taxes === undefined || data.taxes === null ? null : flowWholeClp(data.taxes);
  const balance = data.balance === undefined || data.balance === null ? null : flowWholeClp(data.balance);
  if (fee === null || (data.taxes != null && taxes === null) || (data.balance != null && balance === null)) return null;
  const total = fee + (taxes ?? 0);
  if (!Number.isSafeInteger(total) || total > amount) return null;
  // Without a separate tax field, the balance must prove that fee is the full deduction.
  if (taxes === null && balance === null) return null;
  if (balance !== null && amount - balance !== total) return null;
  return total;
}

/** Flow's existing account is a single merchant account. Third-party sales stay in sandbox. */
export function marketplaceSandboxConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.FLOW_SANDBOX === "true" &&
    Boolean(env.FLOW_API_KEY && env.FLOW_SECRET_KEY && env.DATABASE_URL && env.RESEND_API_KEY &&
      env.MARKETPLACE_SITE_URL?.startsWith("https://") &&
      env.MARKETPLACE_DOWNLOAD_SECRET && env.MARKETPLACE_DOWNLOAD_SECRET.length >= 32);
}

export function marketplaceSandboxEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.VERCEL_ENV === "preview" || env.NODE_ENV === "development") &&
    env.MARKETPLACE_FLOW_SANDBOX_ENABLED === "true" && marketplaceSandboxConfigured(env);
}

export function normalizeBuyerEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function marketplacePriceSnapshot(price: number, taxMode: string) {
  if (!Number.isSafeInteger(price) || price <= 0 || price > 10_000_000) return null;
  if (taxMode !== "tax_inclusive" && taxMode !== "exempt") return null;
  const tax = taxMode === "tax_inclusive" ? price - Math.round(price * 10000 / (10000 + MARKETPLACE_VAT_BPS)) : 0;
  const commission = Math.round(price * MARKETPLACE_COMMISSION_BPS / 10000);
  return { price, taxMode, tax, taxRateBps: taxMode === "tax_inclusive" ? MARKETPLACE_VAT_BPS : 0, commission };
}

function downloadSignature(itemId: string, expires: number, secret: string): string {
  return createHmac("sha256", secret).update(`${itemId}.${expires}`).digest("hex");
}

export function createMarketplaceDownloadToken(itemId: string, expires: number, secret: string): string {
  return `${itemId}.${expires}.${downloadSignature(itemId, expires, secret)}`;
}

export function verifyMarketplaceDownloadToken(token: string, secret: string, now = Date.now()): string | null {
  const match = /^([0-9a-f-]{36})\.(\d{10,13})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return null;
  const expires = Number(match[2]);
  if (!Number.isSafeInteger(expires) || expires < now || expires > now + 30 * 24 * 60 * 60 * 1000) return null;
  const actual = Buffer.from(match[3], "hex");
  const expected = Buffer.from(downloadSignature(match[1], expires, secret), "hex");
  return timingSafeEqual(actual, expected) ? match[1] : null;
}
