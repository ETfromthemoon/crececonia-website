import { getPublishedMarketplaceCover, readMarketplaceReviewAsset } from "@/lib/marketplace-review";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ bookId: string }> }) {
  if (marketplaceDemoAvailable() || !marketplacePublicAvailable()) return new Response("No encontrado", { status: 404 });
  const { bookId } = await params;
  const asset = await getPublishedMarketplaceCover(bookId);
  if (!asset) return new Response("No encontrado", { status: 404 });
  try {
    const image = await readMarketplaceReviewAsset(asset);
    return new Response(image, {
      headers: {
        "content-type": asset.content_type,
        "content-disposition": "inline",
        "cache-control": "private, no-store",
        "cross-origin-resource-policy": "same-origin",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("marketplace_cover_unavailable", error instanceof Error ? error.message : "unknown");
    return new Response("Portada no disponible", { status: 503 });
  }
}
