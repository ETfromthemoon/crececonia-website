import "server-only";
import { acceptEbookDelivery, canSendEbookDelivery, claimEbookDeliveries, failEbookDelivery, wasEbookDeliveryAccepted, type EbookDeliveryClaim, type EbookDeliveryFailure } from "./ebook-delivery";
import { isEbookFinalizationEnabled } from "./ebook-payment-finalization-core";

type Outcome = "accepted" | "retry" | "review" | "uncertain" | "skipped";
export type EbookWorkerCounts = { enabled: boolean; claimed: number } & Record<Outcome, number>;

function failureFor(status: number, name: unknown): EbookDeliveryFailure {
  if (status === 409) return name === "concurrent_idempotent_requests" ? "provider_transient" : "provider_rejected";
  if (status === 429 || status >= 500) return "provider_transient";
  return status >= 400 && status < 500 ? "provider_rejected" : "provider_unknown";
}

async function recordFailure(claim: EbookDeliveryClaim, failure: EbookDeliveryFailure): Promise<Outcome> {
  const recorded = await failEbookDelivery(claim.jobId, claim.leaseToken, failure);
  if (!recorded) return "uncertain";
  return failure === "provider_rejected" || claim.attempts >= 5 ? "review" : "retry";
}

async function deliver(claim: EbookDeliveryClaim, apiKey: string): Promise<Outcome> {
  // Local checks complement SQL clock validation and avoid sending a stale claim.
  const cutoff = Math.min(Date.parse(claim.leaseExpiresAt), Date.parse(claim.firstAttemptAt) + 23 * 60 * 60 * 1000);
  if (cutoff <= Date.now() + 25_000 || !await canSendEbookDelivery(claim.jobId, claim.leaseToken)) return "skipped";
  if (cutoff <= Date.now() + 25_000) return "skipped";
  let response: Response;
  let body: { id?: unknown; name?: unknown } | null;
  try {
    // Direct documented REST request: no hidden SDK retry and a bounded timeout.
    response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(20_000),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": claim.idempotencyKey },
      body: JSON.stringify(claim.payload),
    });
    body = await response.json().catch(() => null);
  } catch {
    return recordFailure(claim, "provider_unknown");
  }
  if (!response.ok) return recordFailure(claim, failureFor(response.status, body?.name));
  if (typeof body?.id !== "string" || !body.id.trim() || body.id.length > 200) return recordFailure(claim, "provider_unknown");
  // Once accepted remotely, an ACK error is never classified as send failure.
  try {
    if (await acceptEbookDelivery(claim.jobId, claim.leaseToken, body.id)) return "accepted";
  } catch { /* Read back a possibly committed ACK; preserve original key on later retry. */ }
  try { return await wasEbookDeliveryAccepted(claim.jobId, body.id) ? "accepted" : "uncertain"; }
  catch { return "uncertain"; }
}

export async function deliverEbookOrders(): Promise<EbookWorkerCounts> {
  const counts: EbookWorkerCounts = { enabled: false, claimed: 0, accepted: 0, retry: 0, review: 0, uncertain: 0, skipped: 0 };
  if (!isEbookFinalizationEnabled() || process.env.EBOOK_DELIVERY_WORKER_ENABLED !== "true") return counts;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("El proveedor de entrega no está configurado.");
  counts.enabled = true;
  // Claim exactly the concurrency we immediately execute, never a sequential queue.
  const claims = await claimEbookDeliveries(2);
  counts.claimed = claims.length;
  const results = await Promise.allSettled(claims.map((claim) => deliver(claim, apiKey)));
  for (const result of results) counts[result.status === "fulfilled" ? result.value : "uncertain"]++;
  return counts;
}
