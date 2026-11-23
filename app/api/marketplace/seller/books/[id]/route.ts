import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Libro inválido", { status: 400 });
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const category = body?.category;
  const price = body?.priceClp;
  if (title.length < 3 || title.length > 180 || description.length < 20 || description.length > 10000
    || !["ia", "tecnologia", "negocios"].includes(category)
    || !Number.isSafeInteger(price) || price < 500 || price > 10_000_000
    || body?.declareRights !== true) return new Response("Datos del ebook inválidos", { status: 400 });
  try {
    const [revision] = await queryDatabase<{ revision_id: string }>(
      `select public.marketplace_edit_book_draft($1,$2::uuid,$3,$4,$5,$6) as revision_id`,
      [sellerIdentityFromRequest(request), id, title, description, category, price]);
    if (!revision?.revision_id) return new Response("El libro no está disponible para edición", { status: 409 });
    return NextResponse.json({ ok: true, revisionId: revision.revision_id });
  } catch (error) {
    console.error("marketplace_seller_revision_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo crear la nueva revisión", { status: 503 });
  }
}
