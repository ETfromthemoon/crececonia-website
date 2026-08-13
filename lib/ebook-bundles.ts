export interface BundleRule {
  minItems: number;
  discountPercent: number;
}

/**
 * Reglas de descuento por cantidad de libros en el combo. Extensible: un
 * ebook #5 no requiere tocar esto — solo agregar la entrada al catálogo
 * (lib/ebook-catalog.ts) y decidir si el tramo de 5+ necesita su propia regla.
 *
 * Tabla fijada para el lanzamiento del 2026-08-07 con el catálogo de 4
 * libros: 2 libros = 10%, 3 = 15%, 4 (la Colección Completa) = 20%.
 */
export const BUNDLE_DISCOUNT_RULES: BundleRule[] = [
  { minItems: 1, discountPercent: 0 },
  { minItems: 2, discountPercent: 10 },
  { minItems: 3, discountPercent: 15 },
  { minItems: 4, discountPercent: 20 },
];

export function getComboDiscountPercent(itemCount: number): number {
  const applicable = BUNDLE_DISCOUNT_RULES.filter((rule) => rule.minItems <= itemCount);
  if (applicable.length === 0) return 0;
  return Math.max(...applicable.map((rule) => rule.discountPercent));
}

export interface BundleItemInput {
  resource: string;
  price: number;
}

export interface BundleItemResult extends BundleItemInput {
  amount: number;
}

export interface BundleTotal {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  items: BundleItemResult[];
}

/**
 * Reparte `total` (ya con el descuento de combo aplicado) proporcionalmente
 * entre los items según su peso en `subtotal`, para que la suma de montos
 * insertados por fila en ebook_purchases cuadre exacto con lo cobrado. El
 * resto del redondeo se absorbe en el último item, no en el primero — así el
 * ajuste cae siempre en el mismo lugar y es predecible en los reportes.
 */
export function computeBundleTotal(items: BundleItemInput[]): BundleTotal {
  if (items.length === 0) {
    throw new Error("computeBundleTotal requiere al menos 1 item.");
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountPercent = getComboDiscountPercent(items.length);
  const total = Math.round(subtotal * (1 - discountPercent / 100));
  const discountAmount = subtotal - total;

  let allocated = 0;
  const resultItems: BundleItemResult[] = items.map((item, index) => {
    if (index === items.length - 1) {
      return { ...item, amount: total - allocated };
    }
    const share = Math.round((item.price / subtotal) * total);
    allocated += share;
    return { ...item, amount: share };
  });

  return { subtotal, discountPercent, discountAmount, total, items: resultItems };
}

export interface EbookBundle {
  slug: string;
  title: string;
  pitch: string;
  /** Resources que componen el bundle, en orden de despliegue. El primero es
   * el "libro ancla": su página de venta es donde se compra el bundle
   * (vía `?bundle=slug`, que preselecciona el resto como extras). */
  resources: string[];
}

/**
 * Bundles con identidad propia (nombre + pitch), a diferencia del combo
 * genérico de checkboxes: agrupan una combinación específica de libros por
 * coherencia temática. El PRECIO no es un número fijo propio — se calcula en
 * runtime con `computeBundleTotal` sobre sus `resources`, reusando el mismo
 * motor de descuento por cantidad que el combo libre. Así un cambio de precio
 * base de un libro se refleja solo, sin mantenimiento manual por bundle.
 */
export const EBOOK_BUNDLES: EbookBundle[] = [
  {
    slug: "coleccion-completa",
    title: "Colección Completa",
    pitch:
      "De no saber nada de IA a operarla, automatizar tu negocio y construir tu web. Los 4 libros.",
    resources: [
      "ebook:de-cero-a-claude-en-una-semana",
      "ebook:claude-nivel-experto",
      "ebook:agentes-de-ia",
      "ebook:creacion-de-webs-con-ia",
    ],
  },
  {
    slug: "ruta-operador",
    title: "Ruta Operador",
    pitch: "Dominar la herramienta de principio a fin. 245 páginas, la progresión más limpia del catálogo.",
    resources: ["ebook:de-cero-a-claude-en-una-semana", "ebook:claude-nivel-experto"],
  },
  {
    slug: "ruta-negocio",
    title: "Ruta Negocio",
    pitch: "Para dueños de negocio, sin programar. 311 páginas de la base más su aplicación directa.",
    resources: ["ebook:de-cero-a-claude-en-una-semana", "ebook:agentes-de-ia"],
  },
  {
    slug: "ruta-constructor",
    title: "Ruta Constructor",
    pitch: "Para quien quiere construir y lanzar sitios. 244 páginas, de los fundamentos al proyecto real.",
    resources: ["ebook:de-cero-a-claude-en-una-semana", "ebook:creacion-de-webs-con-ia"],
  },
  {
    slug: "ruta-automatizacion",
    title: "Ruta Automatización",
    pitch: "Convierte dominio avanzado de Claude en agentes que resuelven trabajo real. Sin programar.",
    resources: ["ebook:claude-nivel-experto", "ebook:agentes-de-ia"],
  },
];

export function getBundle(slug: string): EbookBundle | undefined {
  return EBOOK_BUNDLES.find((bundle) => bundle.slug === slug);
}

export interface EbookPricingUrlSelection {
  initialSelectedExtras?: string[];
  initialOfferId?: string;
  initialPromoCode?: string;
}

/**
 * Resuelve los query params `?bundle=slug` / `?promo=CODIGO` de una página de
 * ebook, del lado del servidor. SOLO debe llamarse desde un Server Component
 * (page.tsx) — este archivo se puede importar sin riesgo ahí, pero EBOOK_BUNDLES
 * (nombres y pitches de los combos, antes del anuncio) no debería viajar al
 * bundle de cliente, así que el resultado ya resuelto es lo único que se le
 * pasa a EbookPricing (componente "use client") como prop.
 */
export function resolveBundleSelectionFromUrl(
  searchParams: Record<string, string | string[] | undefined>,
  resource: string,
  liveResources: readonly string[]
): EbookPricingUrlSelection {
  const bundleSlug = typeof searchParams.bundle === "string" ? searchParams.bundle : undefined;
  const bundle = bundleSlug ? getBundle(bundleSlug) : undefined;

  if (bundle?.resources.includes(resource)) {
    const live = new Set(liveResources);
    const initialSelectedExtras = bundle.resources.filter((r) => r !== resource && live.has(r));
    if (initialSelectedExtras.length !== bundle.resources.length - 1) return {};
    return {
      initialSelectedExtras,
      initialOfferId: bundle.slug,
    };
  }

  // El combo y el código de descuento son mutuamente excluyentes — un link
  // de bundle nunca trae también un promo, pero si alguien arma la URL a
  // mano, el bundle gana (igual que en EbookPricing.toggleExtra).
  const promo = typeof searchParams.promo === "string" ? searchParams.promo : undefined;
  return { initialPromoCode: promo };
}
