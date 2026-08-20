import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getClassAulaSettings } from "@/lib/class-aula-settings";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const key = request.headers.get("x-admin-key") ?? new URL(request.url).searchParams.get("key");
  return Boolean(process.env.ADMIN_SECRET) && key === process.env.ADMIN_SECRET;
}

function optionalHttpsUrl(value: unknown, label: string): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error("protocol");
    return url.toString();
  } catch {
    throw new Error(`${label} debe ser una URL https válida o quedar vacío.`);
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ settings: await getClassAulaSettings() });
}

export async function PUT(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const body = await request.json().catch(() => null);
  try {
    const sessionUrl = optionalHttpsUrl(body?.sessionUrl, "El enlace de Google Meet");
    const whatsappGroupUrl = optionalHttpsUrl(body?.whatsappGroupUrl, "El enlace de WhatsApp");
    const recordingUrl = optionalHttpsUrl(body?.recordingUrl, "El enlace de la grabación");
    const supportEmail = typeof body?.supportEmail === "string" ? body.supportEmail.trim().toLowerCase() : "";
    const classroomEnabled = body?.classroomEnabled;

    if (!/^\S+@\S+\.\S+$/.test(supportEmail)) {
      return NextResponse.json({ error: "El correo de soporte no es válido." }, { status: 400 });
    }
    if (typeof classroomEnabled !== "boolean") {
      return NextResponse.json({ error: "El estado del aula no es válido." }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin().rpc("upsert_class_aula_settings", {
      p_session_url: sessionUrl,
      p_whatsapp_group_url: whatsappGroupUrl,
      p_recording_url: recordingUrl,
      p_support_email: supportEmail,
      p_classroom_enabled: classroomEnabled,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ settings: data?.[0] ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar la configuración.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
