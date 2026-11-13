import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { queryDatabase } from "@/lib/database";

const SESSION_SECONDS = 8 * 60 * 60;
const CHALLENGE_MINUTES = 15;
export const sellerCookieName = () => process.env.NODE_ENV === "production" ? "__Host-crece-seller" : "crece-seller";
export const sellerCookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: SESSION_SECONDS });

function secret(): string {
  const value = process.env.MARKETPLACE_SESSION_SECRET ?? process.env.ADMIN_SECRET;
  if (!value || value.length < 32) throw new Error("La clave de sesión del marketplace no está configurada.");
  return value;
}

export function normalizeSellerEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function tokenHash(value: string): string { return createHash("sha256").update(value).digest("hex"); }

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(`crececonia-seller-session:v1:${payload}`).digest("base64url");
}

export function createSellerSession(identityId: string, now = Date.now()): string {
  if (!/^[a-f0-9-]{36}$/.test(identityId)) throw new Error("Identidad inválida.");
  const issued = Math.floor(now / 1000);
  const payload = `v1.${identityId}.${issued}.${issued + SESSION_SECONDS}.${randomBytes(16).toString("base64url")}`;
  return `${payload}.${signature(payload)}`;
}

export function verifySellerSession(value: string | undefined, now = Date.now()): string | null {
  if (!value || value.length > 240) return null;
  const match = /^(v1\.([a-f0-9-]{36})\.([0-9]+)\.([0-9]+)\.[A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return null;
  const issued = Number(match[3]);
  const expires = Number(match[4]);
  const current = Math.floor(now / 1000);
  if (!Number.isSafeInteger(issued) || !Number.isSafeInteger(expires) || issued > current || expires <= current || expires - issued !== SESSION_SECONDS) return null;
  const received = Buffer.from(match[5]);
  const expected = Buffer.from(signature(match[1]));
  return received.length === expected.length && timingSafeEqual(received, expected) ? match[2] : null;
}

export function sellerIdentityFromRequest(request: Request): string | null {
  const value = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${sellerCookieName()}=`))?.slice(sellerCookieName().length + 1);
  return verifySellerSession(value);
}

export function sellerMutationAllowed(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin && Boolean(sellerIdentityFromRequest(request));
}

export async function requestSellerLogin(email: string, ip: string): Promise<string | null> {
  const ipHash = createHmac("sha256", secret()).update(`ip:${ip}`).digest("hex");
  const emailHash = createHmac("sha256", secret()).update(`email:${email}`).digest("hex");
  // A conditional UPSERT serializes concurrent requests for each hourly key.
  const reserve = async (key: string, maximum: number) => queryDatabase<{ attempts: number }>(`
    insert into marketplace_seller_login_limits (key_hash, hour_start, attempts)
    values ($1, date_trunc('hour', now()), 1)
    on conflict (key_hash, hour_start) do update
      set attempts = marketplace_seller_login_limits.attempts + 1
      where marketplace_seller_login_limits.attempts < $2
    returning attempts`, [key, maximum]);
  if (!(await reserve(emailHash, 3))[0]) return null;
  if (ip !== "unknown" && !(await reserve(ipHash, 20))[0]) return null;
  const token = randomBytes(32).toString("base64url");
  await queryDatabase(`insert into marketplace_seller_login_challenges (email, token_hash, ip_hash, expires_at)
    values ($1, $2, $3, now() + interval '15 minutes')`, [email, tokenHash(token), ipHash]);
  return token;
}

export async function consumeSellerLogin(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const rows = await queryDatabase<{ email: string }>(`update marketplace_seller_login_challenges set consumed_at = now()
    where token_hash = $1 and consumed_at is null and expires_at > now()
    returning email`, [tokenHash(token)]);
  if (!rows[0]) return null;
  const identities = await queryDatabase<{ id: string }>(`insert into marketplace_seller_identities (email, last_login_at)
    values ($1, now()) on conflict (email) do update set last_login_at = now() returning id`, [rows[0].email]);
  return identities[0]?.id ?? null;
}

export const SELLER_CHALLENGE_TTL_MINUTES = CHALLENGE_MINUTES;
