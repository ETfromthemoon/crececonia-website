export type EbookTierPrices = {
  superEarly: number;
  early: number;
  regular: number;
};

export type EbookCatalogEntry =
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      active: true;
      tierPrices: EbookTierPrices;
    }
  | {
      resource: string;
      title: string;
      subject: string;
      href: string;
      active: false;
    };

export const DEFAULT_EBOOK_RESOURCE = "ebook:de-cero-a-claude-en-una-semana";

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
    active: true,
    tierPrices: { superEarly: 10800, early: 17900, regular: 27000 },
  },
  {
    resource: "ebook:agentes-de-ia",
    title: "Agentes de IA",
    subject: "Agentes de IA",
    href: "/ebooks/agentes-de-ia",
    active: false,
  },
  {
    resource: "ebook:sitios-web-ia",
    title: "Sitios web con IA",
    subject: "Sitios web con IA",
    href: "/ebooks/sitios-web-ia",
    active: false,
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
