export const CLASS_PRODUCT_KEY = "clase:clase-en-vivo-2026-08-23";
export const CLASS_PATH = "/clase-en-vivo-2026-08-23";
export const CLASS_TITLE = "Construye una página desde cero con inteligencia artificial";
export const CLASS_DATE_LABEL = "Domingo 23 de agosto";
export const CLASS_START = "2026-08-23T18:00:00-04:00";
export const CLASS_END = "2026-08-23T20:30:00-04:00";
export const CLASS_SESSION_LABEL = "Domingo 23 de agosto · 18:00 a 20:30 h";
export const CLASS_BOOK_RESOURCES = [
  "ebook:de-cero-a-claude-en-una-semana",
  "ebook:claude-nivel-experto",
  "ebook:agentes-de-ia",
  "ebook:creacion-de-webs-con-ia",
] as const;

export type ClassAvailabilityRow = {
  product_id: string;
  product_name: string;
  offer_id: string;
  offer_key: string;
  label: string;
  amount_minor: number;
  total_cupos: number;
  sold_cupos: number;
  reserved_cupos: number;
  sort_order: number;
};
