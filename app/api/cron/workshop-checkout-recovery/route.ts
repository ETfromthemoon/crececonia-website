import { NextResponse } from "next/server";
import { deliverWorkshopCheckoutRecoveries } from "@/lib/workshop-recovery";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.WORKSHOP_RECOVERY_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await deliverWorkshopCheckoutRecoveries();
    return NextResponse.json({ ok: result.failedCount === 0, ...result }, { status: result.failedCount === 0 ? 200 : 503 });
  } catch (reason) {
    console.error("[workshop/recovery] falló el ciclo", reason);
    return NextResponse.json({ ok: false, sentCount: 0, failedCount: 1, suppressedCount: 0 }, { status: 503 });
  }
}
