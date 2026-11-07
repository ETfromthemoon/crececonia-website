import { computeBundleTotal, type BundleItemInput } from "./ebook-bundles";

export const EBOOK_FLASH_START = "2026-11-07T00:00:00-03:00";
export const EBOOK_FLASH_END = "2026-11-08T00:00:00-03:00";
export const EBOOK_FLASH_ID = "flash-2026-11-07";

// Bases aprobadas para toda la jornada, independientes del agotamiento de cupos.
// No se modifican los tiers ni los contadores persistidos.
const FLASH_BASE_PRICES: Record<string, number> = {
  "ebook:de-cero-a-claude-en-una-semana": 17900,
  "ebook:claude-nivel-experto": 13700,
  "ebook:agentes-de-ia": 17900,
  "ebook:creacion-de-webs-con-ia": 13700,
  "ebook:creacion-de-webs-con-ia-parte-2": 9700,
  "ebook:creacion-de-webs-con-ia-parte-3": 9700,
  "ebook:creacion-de-webs-con-ia-parte-4": 9700,
};

export function isEbookFlashActive(now = Date.now()): boolean {
  return now >= Date.parse(EBOOK_FLASH_START) && now < Date.parse(EBOOK_FLASH_END);
}

export function isEbookFlashEligible(resources: readonly string[], now = Date.now()): boolean {
  return isEbookFlashActive(now) && resources.length > 0
    && resources.every((resource) => Object.hasOwn(FLASH_BASE_PRICES, resource));
}

/** Una sola regla compartida por catálogo, navegador y servidor de cobro.
 * Rebaja a la mitad el precio vigente de cada producto, incluidos los bundles.
 */
export function computeEbookTotal(items: BundleItemInput[], now = Date.now()) {
  const resources = items.map((item) => item.resource);
  if (!isEbookFlashEligible(resources, now)) return computeBundleTotal(items);

  const bases = items.map((item) => ({ ...item, price: FLASH_BASE_PRICES[item.resource] }));
  const normal = computeBundleTotal(bases);
  return computeBundleTotal(normal.items.map((item) => ({ resource: item.resource, price: item.amount })), 50);
}
