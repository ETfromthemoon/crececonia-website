import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";
import { uploadPrivateObject } from "@/lib/private-storage";

// Vercel Functions cap request bodies at 4.5 MB; leave room for multipart framing.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sellerMutationAllowed(request)) return new Response("Acceso denegado", { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_FILE_BYTES + 256 * 1024) return new Response("Archivo demasiado grande", { status: 413 });
  const identityId = sellerIdentityFromRequest(request)!;
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Libro inválido", { status: 400 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = form?.get("kind");
  const isPdf = kind === "ebook_pdf";
  const isCover = kind === "cover";
  if (!(file instanceof File) || (!isPdf && !isCover) || file.size < 100 || file.size > MAX_FILE_BYTES
    || (isPdf && file.type !== "application/pdf") || (isCover && !["image/jpeg", "image/png"].includes(file.type))) {
    return new Response("Archivo no permitido: PDF o portada JPG/PNG de hasta 4 MiB", { status: 400 });
  }
  try {
    const rows = await queryDatabase<{ revision_id: string }>(`select b.current_revision_id as revision_id
      from marketplace_books b join marketplace_sellers s on s.id = b.seller_id
      where b.id = $1 and s.owner_user_id = $2 and b.status in ('draft','changes_requested')`, [id, identityId]);
    if (!rows[0]?.revision_id) return new Response("Borrador no disponible", { status: 404 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdfValid = new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-" && new TextDecoder().decode(bytes.subarray(Math.max(0, bytes.length - 2048))).includes("%%EOF");
    const pngValid = bytes.subarray(0, 8).every((value, index) => value === [137,80,78,71,13,10,26,10][index]);
    const jpegValid = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if ((isPdf && !pdfValid) || (isCover && !(file.type === "image/png" ? pngValid : jpegValid))) {
      return new Response("El archivo no coincide con su formato declarado", { status: 400 });
    }
    const extension = isPdf ? "pdf" : file.type === "image/png" ? "png" : "jpg";
    const storageKey = `marketplace/quarantine/${id}/${rows[0].revision_id}/${randomUUID()}.${extension}`;
    const uploaded = await uploadPrivateObject("ebooks", storageKey, bytes, file.type);
    if (uploaded.error) throw new Error(uploaded.error.message);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const inserted = await queryDatabase<{ id: string }>(`with eligible as (
      select b.id, b.current_revision_id as revision_id from marketplace_books b
      join marketplace_sellers s on s.id = b.seller_id
      where b.id = $1 and b.current_revision_id = $2 and s.owner_user_id = $8
        and b.status in ('draft','changes_requested')
      for update of b
    ), inserted as (
      insert into marketplace_assets
        (book_id, revision_id, asset_kind, storage_key, content_type, byte_size, sha256, scan_status)
      select id, revision_id, $3, $4, $5, $6, $7, 'quarantined' from eligible
      returning id
    ), superseded as (
      update marketplace_assets set scan_status = 'rejected'
      where revision_id = $2 and asset_kind = $3 and scan_status = 'quarantined'
        and exists (select 1 from inserted)
      returning id
    ), audit as (
      insert into marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
      select $8, 'asset_uploaded_to_quarantine', 'book', $1 from inserted
      returning entity_id
    ) select id from inserted`,
      [id, rows[0].revision_id, kind, storageKey, file.type, bytes.length, sha256, identityId]);
    if (!inserted[0]) return new Response("El borrador cambió durante la carga; vuelve a subir el archivo", { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("marketplace_seller_upload_error", error instanceof Error ? error.message : "unknown");
    return new Response("No se pudo guardar el PDF", { status: 503 });
  }
}
