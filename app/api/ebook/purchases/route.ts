import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCatalogEntry } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

/**
 * Lista los libros que compró un email, para que la página de recuperación
 * (`/ebook/descargar`) sepa qué ofrecer en vez de asumir el libro 1.
 *
 * Existe porque la recuperación por email entregaba SIEMPRE el libro 1: quien
 * compraba otro libro recibía el PDF equivocado, y quien compraba un combo
 * recibía "no encontramos tu compra". Ver el comentario en
 * /api/ebook/download.
 *
 * Mismo modelo de confianza que /api/ebook/download: el email es la prueba de
 * compra. No se devuelve monto, fecha ni ningún otro dato de la compra —
 * solo qué libros descargar, que es lo único que esta página necesita.
 */
export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("ebook_purchases")
    .select("resource")
    .eq("email", email);

  if (error) {
    console.error(`[ebook/purchases] falló la consulta para ${email}:`, error.message);
    return NextResponse.json(
      { error: "No se pudo verificar la compra. Intenta nuevamente." },
      { status: 500 }
    );
  }

  // Una misma persona puede tener varias filas del mismo libro (comprarlo dos
  // veces crea dos filas: el índice único es (flow_token, resource)) — para
  // descargar, lo que importa es la lista de libros distintos.
  const resources = Array.from(new Set((data ?? []).map((row) => row.resource)));

  const books = resources.map((resource) => ({
    resource,
    title: getCatalogEntry(resource)?.title ?? resource,
  }));

  return NextResponse.json({ books });
}
