import { NextResponse } from "next/server";
import { deliverClassOrders } from "@/lib/class-delivery";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const welcome = await deliverClassOrders("welcome");
  const hub = await deliverClassOrders("hub");
  const ebooks = await deliverClassOrders("ebooks");
  return NextResponse.json({ ok: true, welcomeSent: welcome.sentCount, hubSent: hub.sentCount, ebooksSent: ebooks.sentCount });
}
