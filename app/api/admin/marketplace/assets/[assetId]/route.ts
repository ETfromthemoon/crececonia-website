import { isAdminRequest } from "@/lib/admin-session";
import { getMarketplaceReviewAsset, readMarketplaceReviewAsset } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { assetId } = await params;
  const asset = await getMarketplaceReviewAsset(assetId);
  if (!asset) return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  try {
    const file = await readMarketplaceReviewAsset(asset);
    return new Response(file, {
      headers: {
        "content-type": asset.content_type,
        "content-disposition": asset.asset_kind === "cover" ? 'inline; filename="portada-revision"'
          : 'attachment; filename="ebook-revision.pdf"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[marketplace/asset-download]", error);
    return NextResponse.json({ error: "No se pudo validar el archivo." }, { status: 409 });
  }
}
