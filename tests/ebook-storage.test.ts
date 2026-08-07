import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EBOOK_STORAGE_BUCKET,
  findMissingEbookFiles,
  storageObjectName,
} from "@/lib/ebook-storage";
import { DEFAULT_EBOOK_RESOURCE, getActiveCatalogEntries } from "@/lib/ebook-catalog";

/**
 * Un Supabase falso cuyo bucket contiene exactamente los archivos indicados.
 */
function fakeDb(archivos: string[], error?: string) {
  const list = vi.fn().mockResolvedValue(
    error
      ? { data: null, error: { message: error } }
      : { data: archivos.map((name) => ({ name })), error: null }
  );
  const from = vi.fn(() => ({ list }));
  return { db: { storage: { from } } as unknown as SupabaseClient, from, list };
}

/** Los objetos que hoy hacen falta para que todo libro activo se entregue. */
function objetosRequeridos(): string[] {
  return getActiveCatalogEntries().flatMap((e) => [
    storageObjectName(e.resource, "movil"),
    storageObjectName(e.resource, "a4"),
  ]);
}

describe("findMissingEbookFiles", () => {
  it("no reporta faltantes cuando cada libro a la venta tiene sus dos formatos", async () => {
    const { db } = fakeDb(objetosRequeridos());

    const faltan = await findMissingEbookFiles(db);

    expect(faltan).toEqual([]);
  });

  it("reporta el formato que falta cuando solo está subido uno de los dos", async () => {
    // Este es el caso que dejó compradores con un 503 pese a haber pagado.
    const requeridos = objetosRequeridos();
    const { db } = fakeDb(requeridos.slice(1));

    const faltan = await findMissingEbookFiles(db);

    expect(faltan).toHaveLength(1);
    expect(faltan[0]).toContain(requeridos[0]);
  });

  it("reporta los dos formatos cuando el bucket está vacío", async () => {
    const { db } = fakeDb([]);

    const faltan = await findMissingEbookFiles(db);

    expect(faltan).toHaveLength(objetosRequeridos().length);
    expect(faltan.join(" ")).toContain(DEFAULT_EBOOK_RESOURCE);
  });

  it("ignora archivos ajenos que estén en el bucket", async () => {
    const { db } = fakeDb([...objetosRequeridos(), "notas-internas.pdf", "borrador.pdf"]);

    const faltan = await findMissingEbookFiles(db);

    expect(faltan).toEqual([]);
  });

  it("consulta el bucket privado de ebooks", async () => {
    const { db, from } = fakeDb(objetosRequeridos());

    await findMissingEbookFiles(db);

    expect(from).toHaveBeenCalledWith(EBOOK_STORAGE_BUCKET);
  });

  it("lanza error en vez de dar por buena una lista que no se pudo leer", async () => {
    // Sin esto, un fallo de permisos se vería igual que un bucket sano y el
    // comando de verificación diría "todo OK" sobre datos que nunca leyó.
    const { db } = fakeDb([], "permiso denegado");

    await expect(findMissingEbookFiles(db)).rejects.toThrow(/permiso denegado/);
  });
});
