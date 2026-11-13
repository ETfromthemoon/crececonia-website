import { isAdminRequest } from "@/lib/admin-session";
import { getMarketplaceReviewAsset, readMarketplaceReviewPdf } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const { assetId } = await params;
  const asset = await getMarketplaceReviewAsset(assetId);
  if (!asset) return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  try {
    const pdf = await readMarketplaceReviewPdf(asset);
    return new Response(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="ebook-revision.pdf"',
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[marketplace/asset-download]", error);
    return NextResponse.json({ error: "No se pudo validar el archivo." }, { status: 409 });
  }
}
