import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { queryDatabase } from "@/lib/database";

const WINDOW_SECONDS = 15 * 60;

function hashIdentity(kind: string, value: string, secret: string): string {
  return createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
}

/** Vercel overwrites this header before invoking the function. */
export function marketplaceClientIp(request: Request): string | null {
  const value = request.headers.get("x-vercel-forwarded-for")?.split(",", 1)[0]?.trim();
  return value && isIP(value) ? value : null;
}

export async function allowMarketplaceCheckoutAttempt(
  request: Request,
  email: string,
  bookId: string,
  live: boolean,
): Promise<boolean> {
  const secret = process.env.MARKETPLACE_DOWNLOAD_SECRET;
  if (!secret || secret.length < 32) return false;
  const ip = marketplaceClientIp(request);
  if (live && !ip) return false;
  const ipKey = ip ? hashIdentity("ip", ip, secret) : null;
  const buyerKey = hashIdentity("buyer-book", `${email}:${bookId}`, secret);
  const [result] = await queryDatabase<{ allowed: boolean }>(`
    with limits(key_hash, max_attempts) as (
      select key_hash, max_attempts from (values ($1::char(64), 20), ($2::char(64), 4))
        as v(key_hash, max_attempts) where key_hash is not null
    ), bumped as (
      insert into public.marketplace_checkout_limits
        (key_hash, window_started_at, attempts)
      select key_hash,
        to_timestamp(floor(extract(epoch from now()) / $3) * $3), 1
      from limits
      on conflict (key_hash) do update set
        window_started_at = case
          when marketplace_checkout_limits.window_started_at < excluded.window_started_at
            then excluded.window_started_at
          else marketplace_checkout_limits.window_started_at end,
        attempts = case
          when marketplace_checkout_limits.window_started_at < excluded.window_started_at then 1
          else marketplace_checkout_limits.attempts + 1 end,
        updated_at = now()
      returning key_hash, attempts
    )
    select coalesce(bool_and(b.attempts <= l.max_attempts), false) as allowed
    from bumped b join limits l using (key_hash)`, [ipKey, buyerKey, WINDOW_SECONDS]);
  return result?.allowed === true;
}
