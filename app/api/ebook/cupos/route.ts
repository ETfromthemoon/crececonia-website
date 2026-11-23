import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { computeEbookTotal, isEbookFlashEligible, EBOOK_FLASH_END } from "@/lib/ebook-promotion";
import {
  DEFAULT_EBOOK_RESOURCE,
  getCatalogEntry,
  isCatalogEntryLive,
  isAdminPreviewKey,
} from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") ?? DEFAULT_EBOOK_RESOURCE;
  const previewKey = url.searchParams.get("preview") ?? undefined;

  // No filtrar el precio de un libro que todavía no llegó a su hora de
  // lanzamiento — aunque su página esté gateada, este endpoint es público.
  // `isAdminPreviewKey` deja pasar al dueño del sitio a probar el checkout
  // de un libro antes de esa hora, sin abrirlo al público.
  const entry = getCatalogEntry(resource);
  if (!entry || !entry.active || (!isCatalogEntryLive(entry) && !isAdminPreviewKey(previewKey))) {
    return NextResponse.json({ error: "No disponible." }, { status: 404 });
  }

  const priceInfo = await getCurrentPrice(resource).catch(() => ({
    price: entry.tierPrices.regular,
    tier: "regular",
    remaining: null,
    originalPrice: entry.tierPrices.regular,
  }));
  const pricingTime = Date.now();
  const quote = computeEbookTotal([{ resource, price: priceInfo.price }], pricingTime);
  return NextResponse.json({
    ...priceInfo,
    salePrice: quote.total,
    previousPrice: quote.subtotal,
    pricingTime,
    promotionEndsAt: isEbookFlashEligible([resource], pricingTime) ? EBOOK_FLASH_END : null,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
