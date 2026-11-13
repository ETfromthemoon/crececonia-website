import { processMarketplaceDeliveryBatch } from "@/lib/marketplace-delivery-worker";
import { marketplaceSandboxEnabled } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  if (!marketplaceSandboxEnabled()) return new Response("Unavailable", { status: 503 });
  try {
    return Response.json(await processMarketplaceDeliveryBatch());
  } catch (error) {
    console.error("[marketplace-delivery] worker falló", error);
    return new Response("Retry", { status: 500 });
  }
}
