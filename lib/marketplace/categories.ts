export const MARKETPLACE_CATEGORIES = {
  ia: { label: "Inteligencia artificial", sellerLabel: "IA", coverTone: "violet" },
  tecnologia: { label: "Tecnología", sellerLabel: "Tecnología", coverTone: "blue" },
  negocios: { label: "Negocios", sellerLabel: "Negocios", coverTone: "lime" },
  bienestar: { label: "Vida y bienestar", sellerLabel: "Vida y bienestar", coverTone: "peach" },
} as const;

export type MarketplaceCategory = keyof typeof MARKETPLACE_CATEGORIES;

export function isMarketplaceCategory(value: unknown): value is MarketplaceCategory {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MARKETPLACE_CATEGORIES, value);
}
