import { getClassMaterial } from "@/lib/class-materials";
import { verifyClassHubToken } from "@/lib/class-hub-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!verifyClassHubToken(url.searchParams.get("token") ?? undefined)) return new Response("No autorizado.", { status: 401 });
  const material = getClassMaterial(url.searchParams.get("id"));
  if (!material) return new Response("Material no encontrado.", { status: 404 });
  return new Response(material.content, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${material.filename}"`, "Cache-Control": "private, no-store" } });
}
