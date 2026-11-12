import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;
export const adminCookieName = () => process.env.NODE_ENV === "production" ? "__Host-crece-admin" : "crece-admin";
export const adminCookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: ADMIN_SESSION_SECONDS });

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validAdminCredential(value: string | null | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret && value && value.length <= 4096 && equal(value, secret));
}

function signature(payload: string): string {
  return createHmac("sha256", process.env.ADMIN_SECRET!).update(`crececonia-admin-session:v1:${payload}`).digest("base64url");
}

export function createAdminSession(now = Date.now()): string {
  if (!process.env.ADMIN_SECRET) throw new Error("Administración no configurada.");
  const issued = Math.floor(now / 1000);
  const payload = `v1.${issued}.${issued + ADMIN_SESSION_SECONDS}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${signature(payload)}`;
}

export function validAdminSession(value: string | null | undefined, now = Date.now()): boolean {
  if (!process.env.ADMIN_SECRET || !value || value.length > 256) return false;
  const match = /^(v1\.([0-9]+)\.([0-9]+)\.[A-Za-z0-9_-]{32})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const issued = Number(match[2]);
  const expires = Number(match[3]);
  const seconds = Math.floor(now / 1000);
  return Number.isSafeInteger(issued) && Number.isSafeInteger(expires)
    && issued <= seconds && expires > seconds && expires - issued === ADMIN_SESSION_SECONDS
    && equal(match[4], signature(match[1]));
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

export function isAdminRequest(request: Request): boolean {
  const key = request.headers.get("x-admin-key");
  if (key !== null) return validAdminCredential(key);
  const token = (request.headers.get("cookie") ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${adminCookieName()}=`))?.slice(adminCookieName().length + 1);
  if (!validAdminSession(token)) return false;
  return ["GET", "HEAD", "OPTIONS"].includes(request.method) || sameOrigin(request);
}

export function safeAdminDestination(value: unknown): string {
  const fallback = "/admin/ebook";
  if (typeof value !== "string" || !/^\/admin\/[a-z0-9/-]+$/i.test(value)) return fallback;
  if (value.includes("//") || /\/(login|logout)(\/|$)/i.test(value) || value.includes("..")) return fallback;
  return value;
}
