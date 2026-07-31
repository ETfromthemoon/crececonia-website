/**
 * Número de WhatsApp del negocio, en formato internacional sin "+".
 *
 * Vive acá y no repetido en cada componente porque justamente eso fue el
 * problema: 7 de los 9 CTAs de la landing apuntaban a un placeholder
 * (`569XXXXXXXX`) que nunca se reemplazó, mientras otros 2 sí tenían el
 * número real. Un solo lugar = no puede volver a divergir.
 */
export const WHATSAPP_NUMBER = "56961945206";

/**
 * Construye el link de WhatsApp. `message` se URL-encodea acá para que
 * ningún caller tenga que escribir %20 a mano (otra fuente de errores
 * silenciosos en la versión anterior).
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
