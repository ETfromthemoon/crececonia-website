import { isAdminRequest } from "@/lib/admin-session";
import { setMarketplaceSellerStatus } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  const action = String(form.get("action") ?? "");
  if (action !== "activate" && action !== "suspend") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }
  try {
    const changed = await setMarketplaceSellerStatus(
      String(form.get("seller_id") ?? ""), action, String(form.get("reason") ?? ""),
    );
    if (!changed) return NextResponse.json({ error: "El vendedor cambió o aún no cumple las condiciones." }, { status: 409 });
    return NextResponse.redirect(new URL("/admin/marketplace?resultado=guardado", request.url), { status: 303 });
  } catch (error) {
    console.error("[marketplace/seller-review]", error);
    return NextResponse.json({ error: "No se pudo revisar al vendedor." }, { status: 400 });
  }
}
