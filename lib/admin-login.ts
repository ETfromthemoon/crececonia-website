import "server-only";

// Best-effort per-instance protection, not a distributed rate limiter. A long,
// random ADMIN_SECRET remains necessary; production edge limits add protection.
let failures = 0;
let resetAt = 0;
export function loginLimited(now = Date.now()) {
  if (now >= resetAt) { failures = 0; resetAt = now + 5 * 60 * 1000; }
  return failures >= 20;
}
export function recordLoginFailure() { failures += 1; }

export async function readLoginBody(request: Request): Promise<URLSearchParams> {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new Error("invalid");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new Error("invalid"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}
