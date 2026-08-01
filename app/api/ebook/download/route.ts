import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { EBOOK_STORAGE_BUCKET, storageObjectName } from "@/lib/ebook-storage";

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

async function verifyTokenWithFlow(token: string): Promise<boolean> {
  try {
    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;
    if (!apiKey || !secretKey) return false;
    const params = { apiKey, token };
    const s = flowSign(params, secretKey);
    const url = `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const payment = await res.json();
    return payment?.status === 2;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const rawFormat = searchParams.get("format") ?? "movil";
  const format: Format = VALID_FORMATS.includes(rawFormat as Format)
    ? (rawFormat as Format)
    : "movil";

  if (!email && !token) {
    return NextResponse.json({ error: "Parámetros requeridos." }, { status: 400 });
  }

  const resource = searchParams.get("resource") ?? DEFAULT_EBOOK_RESOURCE;

  const db = getSupabaseAdmin();
  const filterKey = token ? "flow_token" : "email";
  const filterValue = (token ?? email)!;

  let purchaseQuery = db.from("ebook_purchases").select("id, email").eq(filterKey, filterValue);
  if (token) {
    // Un combo inserta varias filas bajo el mismo flow_token (una por libro)
    // — sin este filtro, maybeSingle() encuentra 2+ filas y falla en vez de
    // resolver cuál de los libros del combo se está pidiendo.
    purchaseQuery = purchaseQuery.eq("resource", resource);
  }
  const { data } = await purchaseQuery.maybeSingle();

  if (!data) {
    if (token) {
      const paid = await verifyTokenWithFlow(token);
      if (!paid) {
        return NextResponse.json(
          { error: "No encontramos una compra con esos datos." },
          { status: 404 }
        );
      }
    } else {
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
  const { data: archivo, error: storageError } = await db.storage
    .from(EBOOK_STORAGE_BUCKET)
    .download(storageObjectName(resource, format));

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
