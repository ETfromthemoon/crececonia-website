import { Resend } from "resend";
import { createMarketplaceDownloadToken } from "./marketplace-checkout";

export type MarketplaceDelivery = {
  orderId: string;
  itemId: string;
  buyerEmail: string;
  title: string;
  paidAt: string;
};

export async function sendMarketplaceDelivery(input: MarketplaceDelivery): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const secret = process.env.MARKETPLACE_DOWNLOAD_SECRET;
  const site = process.env.MARKETPLACE_SITE_URL;
  if (!key || !secret || !site) throw new Error("La entrega del marketplace no está configurada.");
  const base = new URL(site);
  if (base.protocol !== "https:") throw new Error("URL de entrega insegura.");
  if (!Number.isFinite(new Date(input.paidAt).getTime())) throw new Error("Fecha de pago inválida.");
  // A delayed retry must never send a link that expired before the email was sent.
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const url = new URL("/api/marketplace/checkout/download", base);
  url.searchParams.set("token", createMarketplaceDownloadToken(input.itemId, expires, secret));
  const title = input.title.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  const { data, error } = await new Resend(key).emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: input.buyerEmail,
    subject: "Tu ebook está listo para descargar",
    html: `<p>Gracias por tu compra en CrececonIA.</p><p><strong>${title}</strong></p><p><a href="${url.toString()}">Descargar ebook</a></p><p>El enlace vence en 7 días. Conserva este correo para solicitar ayuda con tu compra.</p>`,
  }, { idempotencyKey: `marketplace-delivery/${input.orderId}` });
  if (error || !data?.id) throw new Error("Resend no confirmó la entrega.");
}
