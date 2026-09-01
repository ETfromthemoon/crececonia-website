import { NextResponse } from "next/server";
import { deliverWorkshopCheckoutRecoveries } from "@/lib/workshop-recovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await deliverWorkshopCheckoutRecoveries();
  return NextResponse.json({ ok: result.failedCount === 0, ...result }, { status: result.failedCount === 0 ? 200 : 503 });
}
