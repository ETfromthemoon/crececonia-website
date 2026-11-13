import { isAdminRequest } from "@/lib/admin-session";
import { moderateMarketplaceBook, type ReviewAction } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const actions = new Set<ReviewAction>(["approve", "request_changes", "reject", "publish", "pause"]);

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  const action = String(form.get("action") ?? "") as ReviewAction;
  const bookId = String(form.get("book_id") ?? "");
  const revisionId = String(form.get("revision_id") ?? "");
  const reason = String(form.get("reason") ?? "");
  if (!actions.has(action)) return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  try {
    const changed = await moderateMarketplaceBook({ action, bookId, revisionId, reason });
    if (!changed) return NextResponse.json({ error: "El libro cambió o aún no cumple las condiciones." }, { status: 409 });
    return NextResponse.redirect(new URL("/admin/marketplace?resultado=guardado", request.url), { status: 303 });
  } catch (error) {
    console.error("[marketplace/moderation]", error);
    return NextResponse.json({ error: error instanceof Error && !/database|sql|relation/i.test(error.message)
      ? error.message : "No se pudo procesar la revisión." }, { status: 400 });
  }
}
