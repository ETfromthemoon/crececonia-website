import { DEFAULT_EBOOK_RESOURCE } from "./ebook-resource-ids";

export type EbookTierPrices = {
  superEarly: number;
  early: number;
  regular: number;
};

export type EbookSeries = {
  name: string;
  part: number;
};

export type EbookStoreProfile = {
  level: string;
  outcome: string;
  audience: string;
  pageCount: number;
};

export type EbookCatalogEntry =
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      coverSrc: string;
      active: true;
      tierPrices: EbookTierPrices;
      /**
       * Instante ISO (con offset horario explícito) desde el cual el libro
       * es visible y comprable. `undefined` = visible siempre (es el caso del
       * libro 1, ya en venta).
       *
       * Se resuelve en runtime (`isCatalogEntryLive`), NUNCA en build time:
       * un libro con `visibleFrom` en el futuro debe activarse solo con el
       * paso del reloj, sin necesitar un deploy nuevo justo a esa hora. Por
       * eso toda página o endpoint que dependa de esto debe forzar render
       * dinámico (`export const dynamic = "force-dynamic"`) — si Next
       * pre-renderiza la página en build time, la hora de activación queda
       * congelada para siempre en el HTML generado.
       */
      visibleFrom?: string;
      series?: EbookSeries;
      storeProfile: EbookStoreProfile;
    }
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      coverSrc: string;
      active: false;
      storeProfile: EbookStoreProfile;
    };

// Reexportado desde lib/ebook-resource-ids.ts (ver el comentario de ese
// archivo) para no romper a quien ya lo importa desde "./ebook-catalog"
// (código server-only) — el import real vive arriba, junto al resto.
export { DEFAULT_EBOOK_RESOURCE };

// Instante de activación del lanzamiento en vivo del 2026-08-07: 20:50 hora
// de Chile (10 min antes de las 21:00). Chile está en horario de invierno
// (UTC-4) en agosto, sin cambio de horario de verano vigente en esa fecha.
const LANZAMIENTO_2026_08_07 = "2026-08-07T20:50:00-04:00";

/**
 * Catálogo de ebooks. Agregar un libro nuevo = una entrada acá (+ cupos en
 * Supabase cuando se decida activarlo) — el motor de combos no necesita
 * cambios. Los libros "coming-soon" no tienen tierPrices porque su precio
 * todavía no está decidido.
 */
export const EBOOK_CATALOG: EbookCatalogEntry[] = [
  {
    resource: DEFAULT_EBOOK_RESOURCE,
    title: "De cero a Claude en una semana",
    subject: "De cero a Claude en una semana",
    href: "/ebook/de-cero-a-claude-en-una-semana",
    coverSrc: "/ebooks/de-cero-a-claude-en-una-semana.jpg",
    active: true,
    tierPrices: { superEarly: 10800, early: 17900, regular: 27000 },
    storeProfile: { level: "Base", outcome: "Dominar Claude desde cero y usarlo con un método claro.", audience: "Si estás empezando o todavía lo usas como un chat.", pageCount: 150 },
    // Ya está en venta — sin visibleFrom, siempre visible.
  },
  {
    resource: "ebook:claude-nivel-experto",
    title: "Claude a Nivel Experto",
    subject: "Claude a Nivel Experto",
    href: "/ebook/claude-nivel-experto",
    coverSrc: "/ebooks/claude-nivel-experto.jpg",
    active: true,
    tierPrices: { superEarly: 9700, early: 13700, regular: 19700 },
    storeProfile: { level: "Avanzado", outcome: "Pasar de conversar con Claude a operarlo con autonomía.", audience: "Si ya tienes experiencia y quieres profundizar.", pageCount: 71 },
    visibleFrom: LANZAMIENTO_2026_08_07,
  },
  {
    resource: "ebook:agentes-de-ia",
    title: "Agentes de IA para tu Negocio",
    subject: "Agentes de IA para tu Negocio",
    href: "/ebook/agentes-de-ia",
    coverSrc: "/ebooks/agentes-de-ia.jpg",
    active: true,
    tierPrices: { superEarly: 10800, early: 17900, regular: 27000 },
    storeProfile: { level: "Negocio", outcome: "Diseñar agentes que automaticen trabajo real del negocio.", audience: "Si diriges un negocio y no quieres programar.", pageCount: 137 },
    visibleFrom: LANZAMIENTO_2026_08_07,
  },
  {
    resource: "ebook:creacion-de-webs-con-ia",
    title: "Creación de Webs con IA · Parte 1",
    subject: "Creación de Webs con IA",
    href: "/ebook/creacion-de-webs-con-ia",
    coverSrc: "/ebooks/creacion-de-webs-con-ia.jpg",
    active: true,
    tierPrices: { superEarly: 9700, early: 13700, regular: 19700 },
    storeProfile: { level: "Constructor", outcome: "Diseñar y lanzar un sitio completo con IA paso a paso.", audience: "Si quieres construir una web mediante un proyecto real.", pageCount: 70 },
    visibleFrom: LANZAMIENTO_2026_08_07,
    series: { name: "Creación de Webs con IA", part: 1 },
  },
];

export function getCatalogEntry(resource: string): EbookCatalogEntry | undefined {
  return EBOOK_CATALOG.find((entry) => entry.resource === resource);
}

export function getActiveCatalogEntries(): Extract<EbookCatalogEntry, { active: true }>[] {
  return EBOOK_CATALOG.filter(
    (entry): entry is Extract<EbookCatalogEntry, { active: true }> => entry.active
  );
}

export function getOtherActiveEntries(
  resource: string
): Extract<EbookCatalogEntry, { active: true }>[] {
  return getActiveCatalogEntries().filter((entry) => entry.resource !== resource);
}

/**
 * ¿Este libro ya es visible/comprable AHORA? `now` es inyectable para tests;
 * en producción siempre es el reloj real del servidor en el momento del
 * request (nunca un valor cacheado en build time — ver el comentario de
 * `visibleFrom` arriba).
 */
export function isCatalogEntryLive(
  entry: Extract<EbookCatalogEntry, { active: true }>,
  now: number = Date.now()
): boolean {
  if (!entry.visibleFrom) return true;
  return now >= new Date(entry.visibleFrom).getTime();
}

/**
 * Vista previa privada para el dueño del sitio: permite comprar un libro
 * gateado ANTES de su `visibleFrom`, sin abrirlo al público. Reusa
 * ADMIN_SECRET (mismo secreto que ya gatea /admin/*) en vez de crear un
 * secreto nuevo. Server-only — nunca comparar esto en código de cliente, la
 * comparación real siempre pasa por acá para no duplicar la lógica (y el
 * riesgo) en cada endpoint.
 */
export function isAdminPreviewKey(key: string | undefined | null): boolean {
  return Boolean(key && process.env.ADMIN_SECRET && key === process.env.ADMIN_SECRET);
}

export function getLiveCatalogEntries(
  now?: number
): Extract<EbookCatalogEntry, { active: true }>[] {
  return getActiveCatalogEntries().filter((entry) => isCatalogEntryLive(entry, now));
}

export function getOtherLiveEntries(
  resource: string,
  now?: number
): Extract<EbookCatalogEntry, { active: true }>[] {
  return getLiveCatalogEntries(now).filter((entry) => entry.resource !== resource);
}
