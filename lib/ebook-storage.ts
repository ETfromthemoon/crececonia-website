import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_EBOOK_RESOURCE, getActiveCatalogEntries } from "./ebook-catalog";
import { listPrivateObjects } from "./private-storage";

/**
 * Namespace histórico de los ebooks dentro del bucket privado de Neon Object
 * Storage. Se conserva como prefijo para no cambiar nombres ni enlaces.
 *
 * Antes los PDFs se leían del disco del servidor (`/private/*.pdf`). Eso
 * funcionaba solo cuando el deploy se hacía por CLI (`vercel --prod`), porque
 * `/private` está en .gitignore —el repo es público y son un producto pago— y
 * la integración de Git de Vercel construye desde el repositorio: los archivos
 * gitignoreados nunca llegaban. Cada merge dejaba la producción sin PDFs y
 * los compradores recibían 503 "se está preparando".
 *
 * Sirviéndolos desde Neon Object Storage, la entrega es independiente del método de deploy.
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

export const EBOOK_FORMATS: readonly EbookFormat[] = ["movil", "a4"];

/**
 * Comprueba que cada libro A LA VENTA tenga sus dos formatos en Storage, es
 * decir, que sea realmente descargable por quien lo compre.
 *
 * Existe porque poner un libro a la venta es solo cambiar `active: true` en
 * ebook-catalog.ts, y nada obligaba a que sus PDFs estuvieran subidos. El
 * desfase se descubría recién cuando alguien pagaba y recibía un 503.
 *
 * Devuelve los objetos faltantes; un arreglo vacío significa entrega sana.
 */
export async function findMissingEbookFiles(db?: SupabaseClient): Promise<string[]> {
  let names: string[];
  if (db) {
    const { data, error } = await db.storage.from(EBOOK_STORAGE_BUCKET).list("", { limit: 1000 });
    if (error) throw new Error(`No se pudo listar el bucket ${EBOOK_STORAGE_BUCKET}: ${error.message}`);
    names = (data ?? []).map((file) => file.name);
  } else {
    names = await listPrivateObjects(EBOOK_STORAGE_BUCKET);
  }
  const presentes = new Set(names);
  const faltan: string[] = [];

  for (const entry of getActiveCatalogEntries()) {
    for (const format of EBOOK_FORMATS) {
      const objeto = storageObjectName(entry.resource, format);
      if (!presentes.has(objeto)) faltan.push(`${entry.resource} → ${objeto}`);
    }
  }
  return faltan;
}
