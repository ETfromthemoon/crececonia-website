import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { EBOOK_STORAGE_BUCKET, storageObjectName } from "@/lib/ebook-storage";
import { getPurchasedBooksByToken } from "@/lib/ebook-purchased-resources";
import { downloadPrivateObject } from "@/lib/private-storage";

const VALID_FORMATS = ["movil", "a4"] as const;
type Format = (typeof VALID_FORMATS)[number];

function getDownloadFilename(resource: string, format: Format): string {
  if (resource === DEFAULT_EBOOK_RESOURCE) {
    return format === "a4"
      ? "De-cero-a-Claude-en-una-semana-A4.pdf"
      : "De-cero-a-Claude-en-una-semana.pdf";
  }
  const title = getCatalogEntry(resource)?.title ?? resource;
  const base = title.replace(/[^a-zA-Z0-9]+/g, "-");
  return format === "a4" ? `${base}-A4.pdf` : `${base}.pdf`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const rawFormat = searchParams.get("format") ?? "movil";
  const format: Format = VALID_FORMATS.includes(rawFormat as Format)
    ? (rawFormat as Format)
    : "movil";

  if (!token) {
    return NextResponse.json(
      { error: "Pedí un nuevo enlace de descarga desde tu email." },
      { status: 401 }
    );
  }

  const resource = searchParams.get("resource") ?? DEFAULT_EBOOK_RESOURCE;
  if (!getCatalogEntry(resource)) {
    return NextResponse.json({ error: "Ebook no disponible." }, { status: 404 });
  }

  const db = getSupabaseAdmin();

  // El token y el resource deben coincidir en una compra registrada. Durante
  // la carrera normal webhook/retorno, el manifiesto pendiente se consulta
  // con Flow y autoriza solo los recursos incluidos en esa misma orden.
  const { data: rows } = await db
    .from("ebook_purchases")
    .select("id, email")
    .eq("flow_token", token)
    .eq("resource", resource)
    .limit(1);
  const data = rows?.[0] ?? null;

  if (!data) {
    const pendingBooks = await getPurchasedBooksByToken(token);
    if (!pendingBooks.some((book) => book.resource === resource)) {
      return NextResponse.json(
        { error: "No encontramos una compra con esos datos." },
        { status: 404 }
      );
    }
  }

  // El PDF se baja de Supabase Storage, no del disco del servidor. Leerlo del
  // disco solo funcionaba cuando el deploy se hacía por CLI: /private está en
  // .gitignore (el repo es público y el libro es un producto pago), así que la
  // integración de Git de Vercel deployaba sin los archivos y todo comprador
  // recibía 503 "se está preparando".
  const { data: archivo, error: storageError } = await downloadPrivateObject(
    EBOOK_STORAGE_BUCKET,
    storageObjectName(resource, format)
  );

  if (storageError || !archivo) {
    console.error(
      `[ebook/download] no se pudo bajar ${storageObjectName(resource, format)} de Storage:`,
      storageError?.message ?? "sin archivo"
    );
    return NextResponse.json(
      { error: "El archivo está siendo preparado. Intenta en unos minutos." },
      { status: 503 }
    );
  }

  if (data) {
    db.from("ebook_purchases")
      .select("download_count")
      .eq("id", data.id)
      .single()
      .then(({ data: row }) => {
        db.from("ebook_purchases")
          .update({
            download_count: (row?.download_count ?? 0) + 1,
            last_download_at: new Date().toISOString(),
          })
          .eq("id", data.id)
          .then(() => {});
      });
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${getDownloadFilename(resource, format)}"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
