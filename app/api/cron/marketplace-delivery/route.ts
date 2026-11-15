import { deliverMarketplaceOutboxBatch } from "@/lib/marketplace-delivery-worker";
import { marketplaceCallbackConfigured } from "@/lib/marketplace-checkout";
import { queryDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!marketplaceCallbackConfigured()) {
    return Response.json({ skipped: true });
  }
  try {
    const result = await deliverMarketplaceOutboxBatch();
    try {
      await queryDatabase("delete from public.marketplace_checkout_limits where updated_at < now() - interval '2 days'");
    } catch (error) {
      console.error("marketplace_checkout_limit_cleanup_failed", error instanceof Error ? error.message : "unknown");
    }
    return Response.json(result, { status: result.failed > 0 ? 503 : 200 });
  } catch {
    return Response.json({ error: "No se pudo procesar la cola del marketplace." }, { status: 503 });
  }
}
