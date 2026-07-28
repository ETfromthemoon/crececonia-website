import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const resource = new URL(request.url).searchParams.get("resource") ?? DEFAULT_EBOOK_RESOURCE;
  const priceInfo = await getCurrentPrice(resource).catch(() => null);

  if (!priceInfo) {
    return NextResponse.json(
      { price: 27000, tier: "regular", remaining: null, originalPrice: 27000 },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
      }
    );
  }
  return NextResponse.json(priceInfo, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
