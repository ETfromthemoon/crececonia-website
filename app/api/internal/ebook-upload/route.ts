import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_FILES = /^creacion-de-webs-con-ia-parte-[234]-(a4|movil)\.pdf$/;

export async function POST(request: Request) {
  const expectedSecret = process.env.EBOOK_UPLOAD_SECRET;
  const providedSecret = request.headers.get("x-ebook-upload-secret");
  if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const fileName = request.headers.get("x-ebook-file-name") ?? "";
  if (!ALLOWED_FILES.test(fileName) || request.headers.get("content-type") !== "application/pdf") {
    return NextResponse.json({ error: "Archivo no permitido." }, { status: 400 });
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return NextResponse.json({ error: "Archivo vacío." }, { status: 400 });

  const { error } = await getSupabaseAdmin().storage.from("ebooks").upload(fileName, bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    console.error(`[ebook-upload] ${fileName}:`, error.message);
    return NextResponse.json({ error: "No se pudo subir el archivo." }, { status: 502 });
  }

  return NextResponse.json({ uploaded: fileName, bytes: bytes.byteLength });
}
