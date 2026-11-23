import "server-only";

import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";

/** Read-only check against a previously paid ebook on the same Flow account. */
export async function getMarketplaceFlowHealth(): Promise<boolean> {
  const apiKey = process.env.FLOW_API_KEY;
  const secret = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secret || process.env.FLOW_SANDBOX !== "false") return false;
  try {
    const [purchase] = await queryDatabase<{ flow_token: string }>(
      "select flow_token from public.ebook_purchases where flow_token is not null order by purchased_at desc limit 1",
    );
    if (!purchase?.flow_token) return false;
    const params = { apiKey, token: purchase.flow_token };
    const url = new URL(`${getFlowBase()}/payment/getStatus`);
    for (const [key, value] of Object.entries({ ...params, s: flowSign(params, secret) })) url.searchParams.set(key, value);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return false;
    const payment: unknown = await response.json();
    if (!payment || typeof payment !== "object") return false;
    const row = payment as Record<string, unknown>;
    return row.status === 2 && typeof row.payer === "string"
      && Number.isSafeInteger(Number(row.amount)) && Number(row.amount) > 0
      && Number.isSafeInteger(Number(row.flowOrder))
      && typeof row.commerceOrder === "string";
  } catch {
    return false;
  }
}
