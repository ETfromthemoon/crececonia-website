import { NextResponse } from "next/server";
import { sendEbookDeliveryEmail } from "@/lib/ebook-delivery-email";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE = "Si existe una compra asociada, enviamos enlaces nuevos a ese email.";

/**
 * La recuperación no revela ni entrega libros en el navegador: prueba la
 * posesión del email enviando nuevos enlaces a esa bandeja. Esto evita que
 * una dirección conocida funcione como credencial de descarga.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("ebook_purchases")
    .select("resource, flow_token, purchased_at")
    .eq("email", email)
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("[ebook/recover] no se pudieron buscar compras:", error.message);
    return NextResponse.json({ error: "No se pudo solicitar la recuperación. Intenta nuevamente." }, { status: 500 });
  }

  const seenResources = new Set<string>();
  const grants = (data ?? []).flatMap((row) => {
    if (!row.resource || !row.flow_token || seenResources.has(row.resource)) return [];
    seenResources.add(row.resource);
    return [{ resource: row.resource, token: row.flow_token }];
  });

  if (grants.length > 0) {
    try {
      await sendEbookDeliveryEmail({ email, grants, recovery: true });
    } catch (err) {
      console.error("[ebook/recover] no se pudo enviar el email:", err);
      // La respuesta debe ser indistinguible de una dirección sin compras;
      // la persona puede intentar de nuevo, pero el endpoint no confirma qué
      // email tiene una biblioteca asociada.
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
