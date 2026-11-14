import { isAdminRequest } from "@/lib/admin-session";
import { reviewMarketplaceAsset } from "@/lib/marketplace-review";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Formulario inválido." }, { status: 400 });
  const action = String(form.get("action") ?? "");
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }
  if (action === "accept" && form.get("manual_review_confirmed") !== "yes") {
    return NextResponse.json({ error: "Falta confirmar la revisión manual." }, { status: 400 });
  }
  try {
    const changed = await reviewMarketplaceAsset(
      String(form.get("asset_id") ?? ""), action, String(form.get("reason") ?? ""),
    );
    if (!changed) return NextResponse.json({ error: "El archivo cambió o ya fue revisado." }, { status: 409 });
    return NextResponse.redirect(new URL("/admin/marketplace?resultado=guardado", request.url), { status: 303 });
  } catch (error) {
    console.error("[marketplace/asset-review]", error);
    return NextResponse.json({ error: "No se pudo validar el archivo." }, { status: 400 });
  }
}
