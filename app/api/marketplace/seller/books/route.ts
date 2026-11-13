import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";

export async function POST(request: Request) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  const identityId = sellerIdentityFromRequest(request)!;
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
  const category = body?.category;
  const price = body?.priceClp;
  if (title.length < 3 || title.length > 180 || description.length < 20 || description.length > 10000
    || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120
    || !["ia", "tecnologia", "negocios"].includes(category) || !Number.isSafeInteger(price) || price < 500 || price > 10_000_000
    || body?.declareRights !== true) return new Response("Datos del ebook inválidos", { status: 400 });
  try {
    const [seller] = await queryDatabase<{ id: string }>(
      `select id from marketplace_sellers where owner_user_id = $1
       and status in ('draft','pending_verification','active')`, [identityId]);
    if (!seller) return new Response("Perfil de autor no habilitado", { status: 403 });
    const [book] = await queryDatabase<{ book_id: string }>(
      `select public.marketplace_create_book_draft($1,$2,$3,$4,$5,$6) as book_id`,
      [identityId, slug, title, description, category, price]);
    return NextResponse.json({ ok: true, bookId: book.book_id }, { status: 201 });
  } catch (error) {
    if (String(error).includes("unique")) return new Response("Ese identificador de ebook ya está ocupado", { status: 409 });
    console.error("marketplace_seller_book_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo crear el borrador", { status: 503 });
  }
}
