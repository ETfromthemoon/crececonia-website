import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyWorkshopAccessToken } from "@/lib/workshop-access";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";
import { getWorkshopSettings } from "@/lib/workshop-settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const commerceOrder = verifyWorkshopAccessToken(token);
  if (!commerceOrder) return new Response("No autorizado.", { status: 401 });
  const db = getSupabaseAdmin();
  const [{ data: access, error }, settings] = await Promise.all([
    db.rpc("get_workshop_room_access", { p_product_key: WORKSHOP_PRODUCT_KEY, p_commerce_order: commerceOrder }),
    getWorkshopSettings(),
  ]);
  if (error || !access?.[0]?.flow_token) return new Response("No autorizado.", { status: 401 });
  if (!settings.skillsStoragePath) return new Response("El pack todavía no está disponible.", { status: 404 });
  const { data: file, error: storageError } = await db.storage.from("workshop-assets").download(settings.skillsStoragePath);
  if (storageError || !file) return new Response("No pudimos descargar el pack.", { status: 503 });
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Response(buffer, { headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=crececonia-pack-5-skills.zip", "Content-Length": String(buffer.length), "Cache-Control": "private, no-store" } });
}
