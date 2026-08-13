import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  EBOOK_CATALOG,
  DEFAULT_EBOOK_RESOURCE,
  getCatalogEntry,
  getActiveCatalogEntries,
  isCatalogEntryLive,
  getLiveCatalogEntries,
  getOtherLiveEntries,
  isAdminPreviewKey,
} from "@/lib/ebook-catalog";

const ANTES_DEL_LANZAMIENTO = new Date("2026-08-07T10:00:00-04:00").getTime();
const DESPUES_DEL_LANZAMIENTO = new Date("2026-08-07T21:00:00-04:00").getTime();

describe("ebook-catalog", () => {
  it("DEFAULT_EBOOK_RESOURCE apunta al libro 1", () => {
    expect(DEFAULT_EBOOK_RESOURCE).toBe("ebook:de-cero-a-claude-en-una-semana");
  });

  it("getCatalogEntry encuentra una entrada existente", () => {
    const entry = getCatalogEntry(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.resource).toBe(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.active).toBe(true);
  });

  it("getCatalogEntry devuelve undefined para un resource desconocido", () => {
    expect(getCatalogEntry("ebook:no-existe")).toBeUndefined();
  });

  it("el catálogo del lanzamiento 2026-08-07 tiene los 4 libros, todos activos", () => {
    const active = getActiveCatalogEntries();
    expect(active).toHaveLength(4);
    const resources = active.map((e) => e.resource).sort();
    expect(resources).toEqual(
      [
        "ebook:agentes-de-ia",
        "ebook:claude-nivel-experto",
        "ebook:creacion-de-webs-con-ia",
        "ebook:de-cero-a-claude-en-una-semana",
      ].sort()
    );
  });

  it("todo libro activo trae precios, portada y metadata visual escalable", () => {
    for (const entry of getActiveCatalogEntries()) {
      expect(entry.tierPrices.regular).toBeGreaterThan(0);
      expect(entry.coverSrc).toMatch(/^\/ebooks\//);
      expect(entry.storeProfile.level.length).toBeGreaterThan(0);
      expect(entry.storeProfile.outcome.length).toBeGreaterThan(0);
      expect(entry.storeProfile.audience.length).toBeGreaterThan(0);
      expect(entry.storeProfile.pageCount).toBeGreaterThan(0);
    }
  });

  it("el libro 1 no tiene visibleFrom — siempre visible, ya está en venta", () => {
    const libro1 = getCatalogEntry(DEFAULT_EBOOK_RESOURCE)!;
    expect(libro1.active && libro1.visibleFrom).toBeUndefined();
  });

  it("los 3 libros nuevos comparten el mismo instante de lanzamiento", () => {
    const nuevos = ["ebook:claude-nivel-experto", "ebook:agentes-de-ia", "ebook:creacion-de-webs-con-ia"];
    const instantes = nuevos.map((r) => {
      const entry = getCatalogEntry(r)!;
      return entry.active ? entry.visibleFrom : undefined;
    });
    expect(new Set(instantes).size).toBe(1);
    expect(instantes[0]).toBe("2026-08-07T20:50:00-04:00");
  });

  it("creacion-de-webs-con-ia trae metadata de serie (Parte 1)", () => {
    const entry = getCatalogEntry("ebook:creacion-de-webs-con-ia")!;
    expect(entry.active && entry.series).toEqual({ name: "Creación de Webs con IA", part: 1 });
  });

  it("el resource legado 'sitios-web-ia' ya no existe en el catálogo", () => {
    expect(getCatalogEntry("ebook:sitios-web-ia")).toBeUndefined();
  });
});

describe("isCatalogEntryLive", () => {
  it("un libro sin visibleFrom siempre está vivo", () => {
    const libro1 = getCatalogEntry(DEFAULT_EBOOK_RESOURCE)!;
    if (!libro1.active) throw new Error("setup roto");
    expect(isCatalogEntryLive(libro1, ANTES_DEL_LANZAMIENTO)).toBe(true);
    expect(isCatalogEntryLive(libro1, DESPUES_DEL_LANZAMIENTO)).toBe(true);
  });

  it("un libro con visibleFrom NO está vivo antes de ese instante", () => {
    const nuevo = getCatalogEntry("ebook:claude-nivel-experto")!;
    if (!nuevo.active) throw new Error("setup roto");
    expect(isCatalogEntryLive(nuevo, ANTES_DEL_LANZAMIENTO)).toBe(false);
  });

  it("un libro con visibleFrom SÍ está vivo después de ese instante", () => {
    const nuevo = getCatalogEntry("ebook:claude-nivel-experto")!;
    if (!nuevo.active) throw new Error("setup roto");
    expect(isCatalogEntryLive(nuevo, DESPUES_DEL_LANZAMIENTO)).toBe(true);
  });

  it("el instante exacto de visibleFrom ya cuenta como vivo (>=, no >)", () => {
    const nuevo = getCatalogEntry("ebook:claude-nivel-experto")!;
    if (!nuevo.active) throw new Error("setup roto");
    const exacto = new Date(nuevo.visibleFrom!).getTime();
    expect(isCatalogEntryLive(nuevo, exacto)).toBe(true);
  });
});

describe("getLiveCatalogEntries / getOtherLiveEntries", () => {
  it("antes del lanzamiento, solo el libro 1 está vivo", () => {
    const live = getLiveCatalogEntries(ANTES_DEL_LANZAMIENTO);
    expect(live.map((e) => e.resource)).toEqual([DEFAULT_EBOOK_RESOURCE]);
  });

  it("después del lanzamiento, los 4 libros están vivos", () => {
    const live = getLiveCatalogEntries(DESPUES_DEL_LANZAMIENTO);
    expect(live).toHaveLength(4);
  });

  it("getOtherLiveEntries excluye el resource dado y respeta el gating", () => {
    const others = getOtherLiveEntries(DEFAULT_EBOOK_RESOURCE, ANTES_DEL_LANZAMIENTO);
    expect(others).toEqual([]);

    const othersDespues = getOtherLiveEntries(DEFAULT_EBOOK_RESOURCE, DESPUES_DEL_LANZAMIENTO);
    expect(othersDespues).toHaveLength(3);
    expect(othersDespues.every((e) => e.resource !== DEFAULT_EBOOK_RESOURCE)).toBe(true);
  });
});

describe("isAdminPreviewKey", () => {
  const ORIGINAL_SECRET = process.env.ADMIN_SECRET;

  beforeEach(() => {
    process.env.ADMIN_SECRET = "test-secret-123";
  });

  afterEach(() => {
    process.env.ADMIN_SECRET = ORIGINAL_SECRET;
  });

  it("true cuando la key coincide exacto con ADMIN_SECRET", () => {
    expect(isAdminPreviewKey("test-secret-123")).toBe(true);
  });

  it("false cuando la key no coincide", () => {
    expect(isAdminPreviewKey("otra-cosa")).toBe(false);
  });

  it("false cuando no se manda ninguna key", () => {
    expect(isAdminPreviewKey(undefined)).toBe(false);
    expect(isAdminPreviewKey(null)).toBe(false);
    expect(isAdminPreviewKey("")).toBe(false);
  });

  it("false si ADMIN_SECRET no está configurado en el entorno, aunque la key mande el string vacío", () => {
    delete process.env.ADMIN_SECRET;
    // Sin esto, un ADMIN_SECRET vacío/no seteado + una key vacía enviada por
    // error ("") pasarían por === "" === "" — nunca debe alcanzar con "nada
    // contra nada".
    expect(isAdminPreviewKey("")).toBe(false);
    expect(isAdminPreviewKey(undefined)).toBe(false);
  });
});
