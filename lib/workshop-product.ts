export const WORKSHOP_PRODUCT_KEY = "workshop:workshop-en-vivo-2026-09-06";
export const WORKSHOP_PATH = "/workshop-en-vivo-2026-09-06";
export const WORKSHOP_ROOM_PATH = `${WORKSHOP_PATH}/sala`;

// El tema definitivo no venía especificado en el brief. Está centralizado acá
// para que cambiarlo actualice landing, checkout, emails, sala y dashboard.
export const WORKSHOP_TITLE = "Workshop en vivo de inteligencia artificial aplicada";
export const WORKSHOP_OUTCOME = "Una sesión práctica para convertir herramientas de IA en un sistema de trabajo que puedas volver a usar.";
export const WORKSHOP_DATE_LABEL = "Domingo 6 de septiembre";
export const WORKSHOP_START = "2026-09-06T17:00:00-03:00";
export const WORKSHOP_END = "2026-09-06T20:00:00-03:00";
export const WORKSHOP_SESSION_LABEL = "Domingo 6 de septiembre · 17:00 h";
export const WORKSHOP_PRICE = 20_000;
export const WORKSHOP_TIER_SIZE = 5;
export const WORKSHOP_PRICE_STEP = 5_000;

// Interpretación provisional del dictado: "libro de agentes" y "Claude avanzado".
// Si el primer título era otro, basta cambiar este arreglo antes de aplicar el SQL.
export const WORKSHOP_EBOOK_RESOURCES = [
  "ebook:agentes-de-ia",
  "ebook:claude-nivel-experto",
] as const;

export const WORKSHOP_INCLUDED = [
  "Workshop en vivo y práctico",
  "Grabación para revisar a tu ritmo",
  "Agentes de IA para tu Negocio",
  "Claude a Nivel Experto",
  "Pack descargable con 5 skills",
  "1 mes de acceso gratuito a la comunidad SKOOL",
] as const;

export type WorkshopAvailabilityRow = {
  product_id: string;
  product_name: string;
  offer_id: string;
  offer_key: string;
  label: string;
  amount_minor: number;
  total_cupos: number;
  sold_cupos: number;
  reserved_cupos: number;
  sales_today: number;
  revenue_today: number;
  next_amount_minor: number;
};
