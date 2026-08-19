import { Resend } from "resend";
import { CLASS_PATH, CLASS_SESSION_LABEL, CLASS_TITLE } from "./class-product";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character] ?? character));
}

export async function sendClassAccessEmail({
  email,
  offerLabel,
  amount,
  orderId,
}: {
  email: string;
  offerLabel: string;
  amount: number;
  orderId: string;
}): Promise<void> {
  const groupUrl = process.env.CLASS_WHATSAPP_GROUP_URL?.trim();
  const sessionUrl = process.env.CLASS_SESSION_URL?.trim();
  const groupBlock = groupUrl
    ? `<p style="margin:0 0 18px;"><a href="${escapeHtml(groupUrl)}" style="display:inline-block;background:#c5d86d;color:#101112;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:700;">Unirme al grupo de WhatsApp →</a></p>`
    : `<p style="color:#D9B36A;margin:0 0 18px;">La invitación al grupo de WhatsApp será enviada a este mismo correo antes de la clase.</p>`;
  const sessionBlock = sessionUrl
    ? `<p style="margin:0 0 18px;"><a href="${escapeHtml(sessionUrl)}" style="color:#D9B36A;">Abrir enlace de la clase →</a></p>`
    : `<p style="color:#A8A29E;margin:0 0 18px;">El enlace de la sala se compartirá por correo y en el grupo antes de la sesión.</p>`;

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Tu cupo está confirmado · Clase de páginas con IA",
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;"><div style="max-width:560px;margin:0 auto;padding:48px 24px;"><p style="color:#D9B36A;font-size:11px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Clase en vivo</p><h1 style="font-size:25px;font-weight:400;line-height:1.3;margin:0 0 16px;">¡Tu lugar está confirmado!</h1><p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 28px;">Compraste el tramo <strong style="color:#F5F5F4;">${escapeHtml(offerLabel)}</strong> por <strong style="color:#F5F5F4;">$${amount.toLocaleString("es-CL")} CLP</strong>.</p><div style="border:1px solid #2B2B2C;border-radius:18px;padding:22px;margin:0 0 28px;"><p style="font-size:18px;line-height:1.45;margin:0 0 8px;">${escapeHtml(CLASS_TITLE)}</p><p style="color:#D9B36A;margin:0;">${escapeHtml(CLASS_SESSION_LABEL)}</p><p style="color:#A8A29E;margin:8px 0 0;">Duración: 2 a 3 horas · modalidad online</p></div>${groupBlock}${sessionBlock}<p style="color:#A8A29E;font-size:14px;line-height:1.7;margin:0 0 28px;">Incluye skills, guía completa y la colección de cuatro libros <strong style="color:#F5F5F4;">Creación de Webs con IA · Partes 1 a 4</strong>.</p><hr style="border:none;border-top:1px solid #232324;margin:0 0 20px;"><p style="color:#707074;font-size:12px;line-height:1.6;margin:0;">Orden: ${escapeHtml(orderId)}<br/>Si necesitas ayuda, responde este correo.</p></div></body></html>`,
  });
}
