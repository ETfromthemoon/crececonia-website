import { NextResponse } from "next/server";
import { getPublicSkill } from "@/lib/public-catalog";
import { clean, isValidEmail, PUBLIC_LEAD_LIMITS, saveSubscriber } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const skill = getPublicSkill(slug);
  if (!skill?.archivo_nombre) return NextResponse.json({ detail: "Descarga no disponible." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const email = clean(body?.email, PUBLIC_LEAD_LIMITS.email).toLowerCase();
  const source = clean(body?.ref_code, PUBLIC_LEAD_LIMITS.short) || "skill_download";
  if (!isValidEmail(email)) return NextResponse.json({ detail: "Email inválido." }, { status: 400 });
  try {
    await saveSubscriber(email, source, `skill:${slug}`);
    return NextResponse.json({ ok: true, download_url: `/downloads/skills/${skill.archivo_nombre}` });
  } catch (error) {
    console.error("[public/skills/request-download] error:", error);
    return NextResponse.json({ detail: "No pudimos preparar la descarga." }, { status: 500 });
  }
}
