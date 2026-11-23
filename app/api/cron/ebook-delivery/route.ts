import { deliverEbookOrders } from "@/lib/ebook-delivery-worker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  try { return Response.json(await deliverEbookOrders()); }
  catch { return Response.json({ error: "No se pudo procesar la cola de entrega." }, { status: 503 }); }
}
