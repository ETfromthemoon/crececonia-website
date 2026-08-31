import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY, type WorkshopAvailabilityRow } from "@/lib/workshop-product";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  await db.rpc("release_expired_class_reservations");
  const { data, error } = await db.rpc("workshop_product_availability", { p_product_key: WORKSHOP_PRODUCT_KEY });
  const offer = (data?.[0] ?? null) as WorkshopAvailabilityRow | null;
  if (error || !offer) return NextResponse.json({ error: "Entradas no disponibles." }, { status: 503 });
  const remaining = Math.max(offer.total_cupos - offer.sold_cupos - offer.reserved_cupos, 0);
  return NextResponse.json({
    available: remaining > 0,
    offerKey: offer.offer_key,
    amount: offer.amount_minor,
    nextAmount: offer.next_amount_minor,
    salesToday: offer.sales_today,
  }, { headers: { "Cache-Control": "no-store" } });
}
