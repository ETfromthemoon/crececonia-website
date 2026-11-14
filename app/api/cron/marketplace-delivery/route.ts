import { deliverMarketplaceOutboxBatch } from "@/lib/marketplace-delivery-worker";
import { marketplaceSandboxEnabled } from "@/lib/marketplace-checkout";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (process.env.MARKETPLACE_PUBLIC_ENABLED !== "true" && !marketplaceSandboxEnabled()) {
    return Response.json({ skipped: true });
  }
  try {
    const result = await deliverMarketplaceOutboxBatch();
    return Response.json(result, { status: result.failed > 0 ? 503 : 200 });
  } catch {
    return Response.json({ error: "No se pudo procesar la cola del marketplace." }, { status: 503 });
  }
}
