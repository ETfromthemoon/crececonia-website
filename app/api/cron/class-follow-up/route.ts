import { NextResponse } from "next/server";
import { deliverClassOrders } from "@/lib/class-delivery";
import { CLASS_END } from "@/lib/class-product";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  // Evita un envío adelantado aunque el cron se active antes de la fecha real.
  if (Date.now() < Date.parse(CLASS_END) + 8 * 60 * 60 * 1000) return NextResponse.json({ ok: true, skipped: "class_not_finished" });
  const { sentCount } = await deliverClassOrders("follow-up");
  return NextResponse.json({ ok: true, sentCount });
}
