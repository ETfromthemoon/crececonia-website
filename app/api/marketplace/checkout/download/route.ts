import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { MAX_MARKETPLACE_PDF_BYTES, verifyMarketplaceDownloadToken } from "@/lib/marketplace-checkout";
import { downloadPrivateObject } from "@/lib/private-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Grant = { storage_key: string; title: string; sha256: string; byte_size: string | number };

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.MARKETPLACE_DOWNLOAD_SECRET;
  const token = new URL(request.url).searchParams.get("token");
  const itemId = secret && token ? verifyMarketplaceDownloadToken(token, secret) : null;
  if (!itemId) return NextResponse.json({ error: "El enlace de descarga no es válido o venció." }, { status: 401 });
  try {
    const [grant] = await queryDatabase<Grant>(`
      select a.storage_key,a.sha256,a.byte_size,r.title
      from public.marketplace_entitlements e
      join public.marketplace_order_items i on i.id=e.order_item_id
      join public.marketplace_orders o on o.id=i.order_id
      join public.marketplace_book_revisions r on r.id=i.revision_id
      join public.marketplace_assets a on a.revision_id=i.revision_id and a.book_id=i.book_id
        and a.asset_kind='ebook_pdf' and a.scan_status='ready'
      where e.order_item_id=$1 and e.status='active' and o.status='paid'
      order by a.created_at desc limit 1`, [itemId]);
    if (!grant) return NextResponse.json({ error: "La compra no tiene acceso vigente." }, { status: 404 });
    if (!Number.isSafeInteger(Number(grant.byte_size)) || Number(grant.byte_size) > MAX_MARKETPLACE_PDF_BYTES) {
      return NextResponse.json({ error: "El archivo supera el tamaño disponible para descarga." }, { status: 503 });
    }
    const file = await downloadPrivateObject("ebooks", grant.storage_key);
    if (file.error || !file.data) return NextResponse.json({ error: "El archivo no está disponible. Escríbenos para recuperarlo." }, { status: 503 });
    const bytes = Buffer.from(await file.data.arrayBuffer());
    if (bytes.length !== Number(grant.byte_size) || bytes.subarray(0, 5).toString("ascii") !== "%PDF-" ||
      createHash("sha256").update(bytes).digest("hex") !== grant.sha256) {
      return NextResponse.json({ error: "El archivo requiere revisión." }, { status: 503 });
    }
    const name = grant.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "ebook";
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}.pdf"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("[marketplace/checkout/download] error de entrega", error);
    return NextResponse.json({ error: "No se pudo preparar la descarga." }, { status: 503 });
  }
}
