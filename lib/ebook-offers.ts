import { getLiveCatalogEntries } from "./ebook-catalog";
import { getBundle, type EbookBundle } from "./ebook-bundles";

const DE_CERO = "ebook:de-cero-a-claude-en-una-semana";
const CLAUDE_EXPERTO = "ebook:claude-nivel-experto";
const AGENTES = "ebook:agentes-de-ia";
const WEBS = "ebook:creacion-de-webs-con-ia";

/**
 * Las ofertas nombradas son una decisión comercial separada del grafo de
 * checkboxes genéricos. Cada página muestra alternativas coherentes, no un
 * carrito grande por defecto. La Colección Completa se mantiene en catálogo
 * como opción de máximo valor, no como presión en una ficha de producto.
 */
const OFFER_RULES: Record<string, string[]> = {
  [DE_CERO]: ["ruta-operador", "ruta-negocio", "ruta-constructor"],
  [CLAUDE_EXPERTO]: ["ruta-automatizacion"],
  [AGENTES]: ["ruta-negocio", "ruta-automatizacion"],
  [WEBS]: ["ruta-constructor"],
};

export type EbookBundleOffer = {
  id: string;
  title: string;
  pitch: string;
  resources: string[];
  extras: string[];
};

function toOffer(bundle: EbookBundle, resource: string): EbookBundleOffer {
  return {
    id: bundle.slug,
    title: bundle.title,
    pitch: bundle.pitch,
    resources: bundle.resources,
    extras: bundle.resources.filter((item) => item !== resource),
  };
}

export function getEbookBundleOffers(resource: string, now?: number): EbookBundleOffer[] {
  const liveResources = new Set(getLiveCatalogEntries(now).map((entry) => entry.resource));
  return (OFFER_RULES[resource] ?? [])
    .map((slug) => getBundle(slug))
    .filter((bundle): bundle is EbookBundle => Boolean(bundle))
    .filter(
      (bundle) =>
        bundle.resources.includes(resource) && bundle.resources.every((item) => liveResources.has(item))
    )
    .map((bundle) => toOffer(bundle, resource));
}

/** Devuelve la oferta oficial que coincide exactamente con el carrito. */
export function getOfferIdForResources(resources: readonly string[]): string | undefined {
  const requested = new Set(resources);
  if (requested.size !== resources.length) return undefined;

  for (const resource of resources) {
    for (const offer of getEbookBundleOffers(resource)) {
      if (
        offer.resources.length === requested.size &&
        offer.resources.every((item) => requested.has(item))
      ) {
        return offer.id;
      }
    }
  }
  return undefined;
}
