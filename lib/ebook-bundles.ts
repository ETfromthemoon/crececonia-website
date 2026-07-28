export interface BundleRule {
  minItems: number;
  discountPercent: number;
}

/**
 * Reglas de descuento por cantidad de libros en el combo. Extensible: un
 * ebook #4 no requiere tocar esto — solo agregar la entrada al catálogo
 * (lib/ebook-catalog.ts) y decidir si el tramo de 4+ necesita su propia regla.
 */
export const BUNDLE_DISCOUNT_RULES: BundleRule[] = [
  { minItems: 1, discountPercent: 0 },
  { minItems: 2, discountPercent: 10 },
  { minItems: 3, discountPercent: 20 },
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
