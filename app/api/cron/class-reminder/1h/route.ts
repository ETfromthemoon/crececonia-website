import { NextResponse } from "next/server";
import { deliverClassOrders, sendOrganizerChecklist } from "@/lib/class-delivery";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.CLASS_SESSION_URL?.trim()) {
    await sendOrganizerChecklist("blocked", 0);
    return NextResponse.json({ ok: false, reason: "CLASS_SESSION_URL pendiente" }, { status: 409 });
  }
  const { sentCount } = await deliverClassOrders("session-1h");
  await sendOrganizerChecklist("1h", sentCount);
  return NextResponse.json({ ok: true, sentCount });
}
