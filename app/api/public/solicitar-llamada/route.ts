import { NextResponse } from "next/server";
import { clean, notifyAdmin, PUBLIC_LEAD_LIMITS, saveCallRequest } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = clean(body?.token, 64);
  const preferredTimes = Array.isArray(body?.horarios_preferidos)
    ? body.horarios_preferidos.map((v: unknown) => clean(v, PUBLIC_LEAD_LIMITS.short)).filter(Boolean).slice(0, 3)
    : [];
  const message = clean(body?.mensaje, PUBLIC_LEAD_LIMITS.long);
  if (!UUID.test(token) || preferredTimes.length === 0) {
    return NextResponse.json({ detail: "Enlace u horarios inválidos." }, { status: 400 });
  }
  try {
    const row = await saveCallRequest(token, preferredTimes, message);
    if (!row) return NextResponse.json({ detail: "Este enlace no es válido." }, { status: 404 });
    await notifyAdmin(
      `Solicitud de llamada · ${row.nombre}`,
      [`Nombre: ${row.nombre}`, `Email: ${row.email}`, `Horarios: ${preferredTimes.join(" | ")}`,
       `Mensaje: ${message || "Sin mensaje"}`].join("\n"),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[public/solicitar-llamada] error:", error);
    return NextResponse.json({ detail: "No pudimos guardar la solicitud." }, { status: 500 });
  }
}
