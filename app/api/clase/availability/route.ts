import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CLASS_PRODUCT_KEY } from "@/lib/class-product";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = getSupabaseAdmin();
  const commerce = db.schema("commerce");
  await commerce.rpc("release_expired_class_reservations");

  const { data: product, error: productError } = await commerce
    .from("products")
    .select("id,name,status")
    .eq("product_key", CLASS_PRODUCT_KEY)
    .eq("status", "active")
    .maybeSingle();
  if (productError || !product) {
    return NextResponse.json({ error: "Producto no disponible." }, { status: 503 });
  }

  const { data: offers, error: offersError } = await commerce
    .from("product_offers")
    .select("id,offer_key,label,amount_minor,total_cupos,sold_cupos,reserved_cupos,sort_order")
    .eq("product_id", product.id)
    .eq("status", "active")
    .order("sort_order", { ascending: true });
  if (offersError) {
    return NextResponse.json({ error: "No pudimos consultar los cupos." }, { status: 503 });
  }

  return NextResponse.json({
    product: { name: product.name },
    offers: (offers ?? []).map((offer) => ({
      id: offer.id,
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
