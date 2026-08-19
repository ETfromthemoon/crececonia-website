import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ALLOWED_FILES = /^creacion-de-webs-con-ia-parte-[234]-(a4|movil)\.pdf$/;
const TRANSFER_ID = /^[a-z0-9-]{8,80}$/;

function getTransferHeaders(request: Request) {
  const fileName = request.headers.get("x-ebook-file-name") ?? "";
  const transferId = request.headers.get("x-ebook-transfer-id") ?? "";
  const count = Number(request.headers.get("x-ebook-chunk-count"));
  return { fileName, transferId, count };
}

export async function POST(request: Request) {
  const expectedSecret = process.env.EBOOK_UPLOAD_SECRET;
  const providedSecret = request.headers.get("x-ebook-upload-secret");
  if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const mode = request.headers.get("x-ebook-upload-mode") ?? "direct";
  const { fileName, transferId, count } = getTransferHeaders(request);
  if (!ALLOWED_FILES.test(fileName)) {
    return NextResponse.json({ error: "Archivo no permitido." }, { status: 400 });
  }

  const storage = getSupabaseAdmin().storage.from("ebooks");

  if (mode === "chunk") {
    const index = Number(request.headers.get("x-ebook-chunk-index"));
    if (!TRANSFER_ID.test(transferId) || !Number.isInteger(index) || index < 0 || !Number.isInteger(count) || count < 1 || index >= count) {
      return NextResponse.json({ error: "Chunk inválido." }, { status: 400 });
    }
    const bytes = await request.arrayBuffer();
    const chunkName = `ebook-upload-tmp/${transferId}/${index}.pdf`;
    const { error } = await storage.upload(chunkName, bytes, { contentType: "application/pdf", upsert: true });
    if (error) return NextResponse.json({ error: "No se pudo subir el fragmento." }, { status: 502 });
    return NextResponse.json({ uploaded: chunkName, bytes: bytes.byteLength });
  }

  if (mode === "finalize") {
    if (!TRANSFER_ID.test(transferId) || !Number.isInteger(count) || count < 1 || count > 20) {
      return NextResponse.json({ error: "Transferencia inválida." }, { status: 400 });
    }
    const chunks: Buffer[] = [];
    for (let index = 0; index < count; index += 1) {
      const chunkName = `ebook-upload-tmp/${transferId}/${index}.pdf`;
      const { data, error } = await storage.download(chunkName);
      if (error || !data) return NextResponse.json({ error: `Falta el fragmento ${index}.` }, { status: 409 });
      chunks.push(Buffer.from(await data.arrayBuffer()));
    }
    const bytes = Buffer.concat(chunks);
    const { error } = await storage.upload(fileName, bytes, { contentType: "application/pdf", upsert: true });
    await storage.remove(Array.from({ length: count }, (_, index) => `ebook-upload-tmp/${transferId}/${index}.pdf`));
    if (error) return NextResponse.json({ error: "No se pudo reconstruir el archivo." }, { status: 502 });
    return NextResponse.json({ uploaded: fileName, bytes: bytes.byteLength });
  }

  if (request.headers.get("content-type") !== "application/pdf") {
    return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
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
