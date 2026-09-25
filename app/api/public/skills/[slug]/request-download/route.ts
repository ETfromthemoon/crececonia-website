import { NextResponse } from "next/server";
import { getPublicSkill } from "@/lib/public-catalog";
import { captureServerEvent } from "@/lib/posthog-server";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const skill = getPublicSkill(slug);
  if (!skill?.archivo_nombre) return NextResponse.json({ detail: "Descarga no disponible." }, { status: 404 });
  try {
    await captureServerEvent("skill_download_succeeded", crypto.randomUUID(), {
      slug,
      file_type: skill.archivo_tipo,
      route: `/skills/${slug}`,
      page_type: "skill",
      analytics_schema_version: 1,
    });
  } catch (error) {
    console.error("[public/skills/request-download] no se pudo contar la descarga:", error);
  }
  return NextResponse.json({ ok: true, download_url: `/downloads/skills/${skill.archivo_nombre}` });
}
