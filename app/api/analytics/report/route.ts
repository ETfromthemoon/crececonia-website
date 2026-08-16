import { NextResponse } from "next/server";
import { fetchAnalyticsReport } from "@/lib/posthog-analytics";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const supplied = request.headers.get("x-analytics-key") ?? request.headers.get("x-admin-key") ?? "";
  const reportSecret = process.env.ANALYTICS_REPORT_SECRET ?? process.env.ADMIN_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  return Boolean(
    (reportSecret && (bearer === reportSecret || supplied === reportSecret)) ||
    (cronSecret && bearer === cronSecret)
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = new URL(request.url).searchParams.get("days") ?? "7";
  const days = Number(daysParam);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return NextResponse.json({ error: "days debe ser un entero entre 1 y 90" }, { status: 400 });
  }

  try {
    const report = await fetchAnalyticsReport(days, new Date());
    return NextResponse.json(
      { ok: true, scope: "crececonia-ecosystem", report },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("No se pudo generar el reporte de analytics", error);
    return NextResponse.json({ error: "No se pudo generar el reporte de analytics" }, { status: 502 });
  }
}
