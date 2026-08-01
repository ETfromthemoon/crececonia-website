import { DEFAULT_EBOOK_RESOURCE } from "./ebook-catalog";

/**
 * Bucket PRIVADO de Supabase Storage donde viven los PDFs de los ebooks.
 *
 * Antes los PDFs se leían del disco del servidor (`/private/*.pdf`). Eso
 * funcionaba solo cuando el deploy se hacía por CLI (`vercel --prod`), porque
 * `/private` está en .gitignore —el repo es público y son un producto pago— y
 * la integración de Git de Vercel construye desde el repositorio: los archivos
 * gitignoreados nunca llegaban. Cada merge dejaba la producción sin PDFs y
 * los compradores recibían 503 "se está preparando".
 *
 * Sirviéndolos desde Storage, la entrega es independiente del método de deploy.
 * El bucket es privado: el único acceso es /api/ebook/download, que primero
 * valida que la compra exista.
 */
export const EBOOK_STORAGE_BUCKET = "ebooks";

export type EbookFormat = "movil" | "a4";

/**
 * Nombre del objeto dentro del bucket. Se deriva del resource para que un
 * libro nuevo no necesite tocar código: alcanza con subir el archivo con el
 * nombre que devuelve esta función.
 */
export function storageObjectName(resource: string, format: EbookFormat): string {
  // El libro 1 conserva su nombre histórico para no tener que renombrar nada.
  if (resource === DEFAULT_EBOOK_RESOURCE) return `libro-${format}.pdf`;
  const slug = resource.replace(/^ebook:/, "");
  return `${slug}-${format}.pdf`;
}
