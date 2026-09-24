import { NextResponse } from "next/server";
import { clean, isValidEmail, notifyAdmin, PUBLIC_LEAD_LIMITS, saveEvaluation } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const value = {
    nombre: clean(body?.nombre, PUBLIC_LEAD_LIMITS.short),
    email: clean(body?.email, PUBLIC_LEAD_LIMITS.email).toLowerCase(),
    empresa: clean(body?.empresa, PUBLIC_LEAD_LIMITS.short),
    empresa_descripcion: clean(body?.empresa_descripcion, PUBLIC_LEAD_LIMITS.long),
    tamano_equipo: clean(body?.tamano_equipo, 40),
    rol: clean(body?.rol, PUBLIC_LEAD_LIMITS.short),
    proceso_pain: clean(body?.proceso_pain, PUBLIC_LEAD_LIMITS.long),
    uso_ia_actual: clean(body?.uso_ia_actual, 40),
    resultado_esperado: clean(body?.resultado_esperado, PUBLIC_LEAD_LIMITS.long),
    horizonte_decision: clean(body?.horizonte_decision, 40),
    source: clean(body?.source, PUBLIC_LEAD_LIMITS.short),
  };
  if (!isValidEmail(value.email) || !value.nombre || !value.empresa || !value.rol ||
      !value.proceso_pain || !value.resultado_esperado || !value.tamano_equipo ||
      !value.uso_ia_actual || !value.horizonte_decision) {
    return NextResponse.json({ detail: "Revisa los campos obligatorios." }, { status: 400 });
  }
  try {
    const row = await saveEvaluation(value);
    const schedulingUrl = new URL(`/solicitar-llamada?t=${row.scheduling_token}`, request.url).toString();
    await notifyAdmin(
      `Nueva evaluación · ${value.empresa}`,
      [`Nombre: ${value.nombre}`, `Email: ${value.email}`, `Empresa: ${value.empresa}`,
       `Rol: ${value.rol}`, `Equipo: ${value.tamano_equipo}`, `Uso IA: ${value.uso_ia_actual}`,
       `Proceso: ${value.proceso_pain}`, `Resultado: ${value.resultado_esperado}`,
       `Horizonte: ${value.horizonte_decision}`, `Origen: ${value.source || "directo"}`,
       `Enlace para agendar: ${schedulingUrl}`].join("\n"),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[public/evaluacion] error:", error);
    return NextResponse.json({ detail: "No pudimos guardar la evaluación." }, { status: 500 });
  }
}
