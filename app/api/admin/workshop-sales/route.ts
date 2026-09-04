import { NextResponse } from "next/server";
import { deliverLateWorkshopAccessIfNeeded, deliverWorkshopOrders } from "@/lib/workshop-delivery";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";

export const dynamic = "force-dynamic";
const authorized = (request: Request) => Boolean(process.env.ADMIN_SECRET) && request.headers.get("x-admin-key") === process.env.ADMIN_SECRET;
const validEmail = (value: unknown): value is string => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === "advance") {
      const { error } = await getSupabaseAdmin().rpc("admin_advance_workshop_tier", { p_product_key: WORKSHOP_PRODUCT_KEY });
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: "El siguiente tramo ya está publicado." });
    }
    if (body?.action === "manual") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!validEmail(email)) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
      const { data, error } = await getSupabaseAdmin().rpc("admin_register_workshop_purchase", { p_product_key: WORKSHOP_PRODUCT_KEY, p_email: email });
      const commerceOrder = typeof data === "string" ? data : null;
      if (error || !commerceOrder) throw new Error(error?.message ?? "No se pudo registrar la compra.");
      await deliverWorkshopOrders("welcome", commerceOrder);
      await deliverWorkshopOrders("ebooks", commerceOrder);
      await deliverWorkshopOrders("admin-notification", commerceOrder);
      await deliverLateWorkshopAccessIfNeeded(commerceOrder);
      return NextResponse.json({ message: `${email} fue agregado y recibió sus accesos.` });
    }
    return NextResponse.json({ error: "Operación inválida." }, { status: 400 });
  } catch (reason) {
    console.error("[admin/workshop-sales]", reason);
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "No se pudo completar la operación." }, { status: 400 });
  }
}
