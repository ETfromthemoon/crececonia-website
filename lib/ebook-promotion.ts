import { computeBundleTotal, type BundleItemInput } from "./ebook-bundles";

export const EBOOK_FLASH_START = "2026-11-15T00:00:00-03:00";
export const EBOOK_FLASH_END = "2026-11-16T00:00:00-03:00";
export const EBOOK_FLASH_ID = "flash-2026-11-15";

export function isEbookFlashActive(now = Date.now()): boolean {
  return now >= Date.parse(EBOOK_FLASH_START) && now < Date.parse(EBOOK_FLASH_END);
}

export function isEbookFlashEligible(resources: readonly string[], now = Date.now()): boolean {
  return isEbookFlashActive(now) && resources.length > 0;
}

/** Aplica 30% sobre el precio vigente, después del descuento habitual del combo. */
export function computeEbookTotal(items: BundleItemInput[], now = Date.now()) {
  const resources = items.map((item) => item.resource);
  const normal = computeBundleTotal(items);
  if (!isEbookFlashEligible(resources, now)) return normal;
  return computeBundleTotal(normal.items.map((item) => ({ resource: item.resource, price: item.amount })), 30);
}
