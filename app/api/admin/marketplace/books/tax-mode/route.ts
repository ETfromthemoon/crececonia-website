import { isAdminRequest } from "@/lib/admin-session";
import { setMarketplaceBookTaxMode } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  const mode = String(form.get("tax_mode") ?? "");
  if (mode !== "tax_inclusive" && mode !== "exempt") {
    return NextResponse.json({ error: "Tratamiento tributario inválido." }, { status: 400 });
  }
  try {
    const changed = await setMarketplaceBookTaxMode(
      String(form.get("book_id") ?? ""), String(form.get("revision_id") ?? ""),
      mode, String(form.get("reason") ?? ""),
    );
    if (!changed) return NextResponse.json({ error: "La revisión cambió o faltan verificaciones tributarias." }, { status: 409 });
    return NextResponse.redirect(new URL("/admin/marketplace?resultado=guardado", request.url), { status: 303 });
  } catch (error) {
    console.error("[marketplace/book-tax-review]", error);
    return NextResponse.json({ error: "No se pudo registrar la decisión tributaria." }, { status: 400 });
  }
}
