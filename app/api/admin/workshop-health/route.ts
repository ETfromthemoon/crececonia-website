import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";
import { getWorkshopFulfillmentReadiness } from "@/lib/workshop-readiness";
import { getWorkshopEmailHealth } from "@/lib/workshop-email-health";

export const dynamic = "force-dynamic";
const authorized = (request: Request) => Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-key") === process.env.ADMIN_SECRET;

type Check = { key: string; label: string; ok: boolean; detail: string };

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const db = getSupabaseAdmin();
  const [availability, fulfillment, recoveryProbe, emailHealth] = await Promise.all([
    db.rpc("workshop_product_availability", { p_product_key: WORKSHOP_PRODUCT_KEY }),
    getWorkshopFulfillmentReadiness(),
    db.rpc("claim_workshop_access_recovery", { p_product_key: WORKSHOP_PRODUCT_KEY, p_email: "workshop-health-probe@invalid.example" }),
    getWorkshopEmailHealth(),
  ]);
  const { settings, assets, recordingReachable } = fulfillment;
  const checks: Check[] = [
    { key: "sales", label: "Venta evergreen", ok: !availability.error && Boolean(availability.data?.[0]), detail: availability.error?.message ?? "Oferta grabada disponible" },
    { key: "recording", label: "Grabación", ok: recordingReachable, detail: settings.recordingUrl ? (recordingReachable ? "Enlace responde correctamente" : "El enlace no es accesible sin permisos adicionales") : "Falta agregar el enlace" },
    { key: "slides", label: "Slides", ok: assets.slides, detail: assets.slides ? "Archivo privado verificado" : "Falta subir el archivo" },
    { key: "handout", label: "Hoja de trabajo", ok: assets.handout, detail: assets.handout ? "Archivo privado verificado" : "Falta subir el archivo" },
    { key: "skills", label: "Pack de skills", ok: assets.skills, detail: assets.skills ? "ZIP privado verificado" : "Falta subir el ZIP" },
    { key: "ebooks", label: "Dos ebooks incluidos", ok: fulfillment.missingEbookFiles.length === 0, detail: fulfillment.missingEbookFiles.length ? `Faltan: ${fulfillment.missingEbookFiles.join(", ")}` : "PDF móvil y A4 verificados para ambos libros" },
    { key: "skool", label: "Comunidad SKOOL", ok: Boolean(settings.skoolUrl), detail: settings.skoolUrl ? "Enlace configurado" : "Falta agregar la invitación" },
    { key: "room", label: "Sala privada", ok: settings.roomEnabled, detail: settings.roomEnabled ? "Publicada" : "Desactivada" },
    { key: "access-secret", label: "Firma de accesos", ok: Boolean(process.env.WORKSHOP_ACCESS_SECRET || process.env.FLOW_SECRET_KEY), detail: "Secreto disponible sólo en servidor" },
    { key: "resend", label: "Dominio de correo", ok: emailHealth.domainReady, detail: emailHealth.domainReady ? "crececonia.cl verificado en Resend" : "No se pudo confirmar el dominio" },
    { key: "webhook", label: "Seguimiento de correos", ok: emailHealth.webhookReady, detail: emailHealth.webhookReady ? "Webhook habilitado, firmado y con todos los eventos" : !emailHealth.webhookFound ? "No existe un webhook para producción" : emailHealth.missingWebhookEvents.length ? `Faltan eventos: ${emailHealth.missingWebhookEvents.join(", ")}` : "Webhook deshabilitado o sin secreto" },
    { key: "recovery", label: "Recuperación de acceso", ok: !recoveryProbe.error, detail: recoveryProbe.error?.message ?? "RPC disponible y auditado" },
  ];
  return NextResponse.json({ ok: checks.every((check) => check.ok), generatedAt: new Date().toISOString(), checks }, { headers: { "Cache-Control": "no-store" } });
}
