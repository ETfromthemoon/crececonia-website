import "server-only";
import { downloadPrivateObject } from "./private-storage";
import { getSupabaseAdmin } from "./supabase";
import { verifyWorkshopAccessToken } from "./workshop-access";
import { WORKSHOP_ASSETS, type WorkshopAssetKey } from "./workshop-assets";
import { WORKSHOP_PRODUCT_KEY } from "./workshop-product";

export async function serveWorkshopAsset(request: Request, assetKey: WorkshopAssetKey) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined;
  const commerceOrder = verifyWorkshopAccessToken(token);
  if (!commerceOrder) return new Response("No autorizado.", { status: 401 });

  const { data: access, error } = await getSupabaseAdmin().rpc("get_workshop_room_access", {
    p_product_key: WORKSHOP_PRODUCT_KEY,
    p_commerce_order: commerceOrder,
  });
  if (error || !access?.[0]?.flow_token) return new Response("No autorizado.", { status: 401 });

  const asset = WORKSHOP_ASSETS[assetKey];
  const { data: file, error: storageError } = await downloadPrivateObject("workshop-assets", asset.storagePath);
  if (storageError || !file) return new Response("El recurso todavía no está disponible.", { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Response(buffer, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Disposition": `${asset.disposition}; filename="${asset.filename}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
