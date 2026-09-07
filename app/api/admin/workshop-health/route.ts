import { NextResponse } from "next/server";
import { getWorkshopAssetStatus } from "@/lib/workshop-asset-storage";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";
import { getWorkshopSettings } from "@/lib/workshop-settings";

export const dynamic = "force-dynamic";
const authorized = (request: Request) => Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-key") === process.env.ADMIN_SECRET;

type Check = { key: string; label: string; ok: boolean; detail: string };

async function reachable(url: string) {
  if (!url) return false;
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8_000), cache: "no-store" });
    return response.ok || (response.status >= 300 && response.status < 400);
  } catch { return false; }
}

async function resendDomainReady() {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const response = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return false;
    const payload = await response.json() as { data?: Array<{ name?: string; status?: string }> };
    return Boolean(payload.data?.some((domain) => domain.name === "crececonia.cl" && domain.status === "verified"));
  } catch { return false; }
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const db = getSupabaseAdmin();
  const [availability, settings, assets, emailDomain] = await Promise.all([
    db.rpc("workshop_product_availability", { p_product_key: WORKSHOP_PRODUCT_KEY }),
    getWorkshopSettings(),
    getWorkshopAssetStatus(),
    resendDomainReady(),
  ]);
  const recordingReachable = await reachable(settings.recordingUrl);
  const checks: Check[] = [
    { key: "sales", label: "Venta evergreen", ok: !availability.error && Boolean(availability.data?.[0]), detail: availability.error?.message ?? "Oferta grabada disponible" },
    { key: "recording", label: "Grabación", ok: recordingReachable, detail: settings.recordingUrl ? (recordingReachable ? "Enlace responde correctamente" : "El enlace no es accesible sin permisos adicionales") : "Falta agregar el enlace" },
    { key: "slides", label: "Slides", ok: assets.slides, detail: assets.slides ? "Archivo privado verificado" : "Falta subir el archivo" },
    { key: "handout", label: "Hoja de trabajo", ok: assets.handout, detail: assets.handout ? "Archivo privado verificado" : "Falta subir el archivo" },
    { key: "skills", label: "Pack de skills", ok: assets.skills, detail: assets.skills ? "ZIP privado verificado" : "Falta subir el ZIP" },
    { key: "skool", label: "Comunidad SKOOL", ok: Boolean(settings.skoolUrl), detail: settings.skoolUrl ? "Enlace configurado" : "Falta agregar la invitación" },
    { key: "room", label: "Sala privada", ok: settings.roomEnabled, detail: settings.roomEnabled ? "Publicada" : "Desactivada" },
    { key: "access-secret", label: "Firma de accesos", ok: Boolean(process.env.WORKSHOP_ACCESS_SECRET || process.env.FLOW_SECRET_KEY), detail: "Secreto disponible sólo en servidor" },
    { key: "resend", label: "Dominio de correo", ok: emailDomain, detail: emailDomain ? "crececonia.cl verificado en Resend" : "No se pudo confirmar el dominio" },
    { key: "webhook", label: "Seguimiento de correos", ok: Boolean(process.env.RESEND_WEBHOOK_SECRET), detail: "Webhook firmado de Resend" },
  ];
  return NextResponse.json({ ok: checks.every((check) => check.ok), generatedAt: new Date().toISOString(), checks }, { headers: { "Cache-Control": "no-store" } });
}
