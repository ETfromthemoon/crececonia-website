import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { ClassAvailabilityRow } from "@/lib/class-product";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  await db.rpc("release_expired_class_reservations");
  const { data: rows, error: availabilityError } = await db.rpc("class_product_availability");
  const availability = (rows ?? []) as ClassAvailabilityRow[];
  if (availabilityError || availability.length === 0) {
    return NextResponse.json({ error: "Producto no disponible." }, { status: 503 });
  }

  return NextResponse.json({
    product: { name: availability[0].product_name },
    offers: availability.map((offer) => ({
      id: offer.offer_id,
      offerKey: offer.offer_key,
      label: offer.label,
      amount: offer.amount_minor,
      totalCupos: offer.total_cupos,
      soldCupos: offer.sold_cupos,
      reservedCupos: offer.reserved_cupos,
      remaining: Math.max(offer.total_cupos - offer.sold_cupos - offer.reserved_cupos, 0),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
