import "server-only";

/** Library authentication stays unavailable until its migration and secrets are configured. */
export function isEbookLibraryEnabled(): boolean {
  return process.env.EBOOK_LIBRARY_ENABLED === "true"
    && process.env.EBOOK_LIBRARY_RATE_SECRET !== undefined
    && Buffer.byteLength(process.env.EBOOK_LIBRARY_RATE_SECRET, "utf8") >= 32
    && Boolean(process.env.RESEND_API_KEY?.trim())
    && Boolean(process.env.RESEND_FROM_EMAIL?.trim());
}

export const EBOOK_LIBRARY_CHALLENGE_TTL_SECONDS = 15 * 60;
export const EBOOK_LIBRARY_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const EBOOK_LIBRARY_COOKIE = "ebook_library_session";

export function normalizeLibraryEmail(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 254) return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function createOpaqueToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
}

export async function hashLibraryValue(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Buffer.from(digest).toString("hex");
}

export async function libraryRateKey(kind: "email" | "ip", value: string): Promise<string> {
  const secret = process.env.EBOOK_LIBRARY_RATE_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) throw new Error("Library disabled");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${kind}:${value}`));
  return Buffer.from(signature).toString("hex");
}
