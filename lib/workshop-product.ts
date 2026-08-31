export const WORKSHOP_PRODUCT_KEY = "workshop:workshop-en-vivo-2026-09-06";
export const WORKSHOP_PATH = "/workshop-en-vivo-2026-09-06";
export const WORKSHOP_ROOM_PATH = `${WORKSHOP_PATH}/sala`;

export const WORKSHOP_TITLE = "Workshop en vivo de Claude aplicado";
export const WORKSHOP_OUTCOME = "Aprende Claude de forma práctica y conviértelo en una herramienta de trabajo que puedas volver a usar.";
export const WORKSHOP_DATE_LABEL = "Domingo 6 de septiembre";
export const WORKSHOP_START = "2026-09-06T17:00:00-03:00";
export const WORKSHOP_END = "2026-09-06T20:00:00-03:00";
export const WORKSHOP_SESSION_LABEL = "Domingo 6 de septiembre · 17:00 h";
export const WORKSHOP_PRICE = 20_000;
export const WORKSHOP_TIER_SIZE = 5;
export const WORKSHOP_PRICE_STEP = 5_000;

export function isWorkshopRecordingOnSale(now = Date.now()) {
  return now >= Date.parse(WORKSHOP_END);
}

export const WORKSHOP_EBOOK_RESOURCES = [
  "ebook:de-cero-a-claude-en-una-semana",
  "ebook:claude-nivel-experto",
] as const;

export const WORKSHOP_INCLUDED = [
  "Workshop en vivo y práctico",
  "Grabación para revisar a tu ritmo",
  "Ebook De cero a Claude en una semana — nivel principiante",
  "Ebook Claude a Nivel Experto — nivel avanzado",
  "Pack descargable con 5 skills",
  "1 mes de acceso gratuito a la comunidad SKOOL",
] as const;

export const WORKSHOP_RECORDING_INCLUDED = [
  "Clase grabada para ver a tu ritmo",
  "Ebook De cero a Claude en una semana — nivel principiante",
  "Ebook Claude a Nivel Experto — nivel avanzado",
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
