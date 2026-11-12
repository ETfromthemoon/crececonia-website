import { NextResponse } from "next/server";
import { parseQualification } from "@/lib/service-qualification";
import { saveQualification } from "@/lib/service-qualification-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ detail: "Origen inválido." }, { status: 403 });
  let value: ReturnType<typeof parseQualification>;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return NextResponse.json({ detail: "Formulario demasiado extenso." }, { status: 413 });
    value = parseQualification(JSON.parse(raw));
  } catch {
    return NextResponse.json({ detail: "Revisa los campos obligatorios y sus límites." }, { status: 400 });
  }
  if (!value.qualified) return NextResponse.json({ qualified: false });
  try {
    const saved = await saveQualification(value);
    if (!saved) return NextResponse.json({ detail: "Esta solicitud ya contiene otras respuestas. Vuelve a cargar el formulario." }, { status: 409 });
    return NextResponse.json({ ok: true, qualified: true, id: saved.id });
  } catch {
    // Do not log form content, database parameters or contact details.
    console.error("[qualification] No se pudo persistir la postulación.");
    return NextResponse.json({ detail: "No pudimos guardar tu postulación. Tus respuestas siguen aquí; vuelve a intentarlo." }, { status: 503 });
  }
}
