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

function classDetailsHtml() {
  return `<div style="border:1px solid #2B2B2C;border-radius:18px;padding:22px;margin:0 0 28px;"><p style="font-size:18px;line-height:1.45;margin:0 0 8px;">${escapeHtml(CLASS_TITLE)}</p><p style="color:#D9B36A;margin:0;">${escapeHtml(CLASS_SESSION_LABEL)}</p><p style="color:#A8A29E;margin:8px 0 0;">Duración: 2 a 3 horas · modalidad online</p></div>`;
}

function groupBlock() {
  const groupUrl = process.env.CLASS_WHATSAPP_GROUP_URL?.trim();
  return groupUrl
    ? `<p style="margin:0 0 18px;"><a href="${escapeHtml(groupUrl)}" style="display:inline-block;background:#c5d86d;color:#101112;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:700;">Unirme al grupo de WhatsApp →</a></p>`
    : `<p style="color:#D9B36A;margin:0 0 18px;">La invitación al grupo de WhatsApp será enviada a este mismo correo antes de la clase.</p>`;
}

function sessionBlock() {
  const sessionUrl = process.env.CLASS_SESSION_URL?.trim();
  return sessionUrl
    ? `<p style="margin:0 0 18px;"><a href="${escapeHtml(sessionUrl)}" style="display:inline-block;background:#c5d86d;color:#101112;padding:13px 18px;border-radius:999px;text-decoration:none;font-weight:700;">Entrar a la sala de la clase →</a></p>`
    : `<p style="color:#A8A29E;margin:0 0 18px;">El enlace de la sala se compartirá por correo y en el grupo antes de la sesión.</p>`;
}

function shell(title: string, body: string, footer: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;"><div style="max-width:560px;margin:0 auto;padding:48px 24px;"><p style="color:#D9B36A;font-size:11px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Clase en vivo</p><h1 style="font-size:25px;font-weight:400;line-height:1.3;margin:0 0 16px;">${title}</h1>${body}<hr style="border:none;border-top:1px solid #232324;margin:0 0 20px;"><p style="color:#707074;font-size:12px;line-height:1.6;margin:0;">${footer}</p></div></body></html>`;
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
  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Tu cupo está confirmado · Clase de páginas con IA",
    html: shell("¡Tu lugar está confirmado!", `<p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 28px;">Compraste el tramo <strong style="color:#F5F5F4;">${escapeHtml(offerLabel)}</strong> por <strong style="color:#F5F5F4;">$${amount.toLocaleString("es-CL")} CLP</strong>.</p>${classDetailsHtml()}${groupBlock()}<p style="color:#A8A29E;font-size:14px;line-height:1.7;margin:0 0 28px;">El enlace de Zoom llegará solamente por correo <strong style="color:#F5F5F4;">60 minutos antes</strong> y se reenviará <strong style="color:#F5F5F4;">10 minutos antes</strong> de comenzar.</p><p style="color:#A8A29E;font-size:14px;line-height:1.7;margin:0 0 28px;">Incluye skills, guía completa y la colección de cuatro libros <strong style="color:#F5F5F4;">Creación de Webs con IA · Partes 1 a 4</strong>.</p>`, `Orden: ${escapeHtml(orderId)}<br/>Si necesitas ayuda, responde este correo.`),
  });
}

export async function sendClassSessionEmail({ email, timing }: { email: string; timing: "1h" | "10m" }) {
  const sessionUrl = process.env.CLASS_SESSION_URL?.trim();
  if (!sessionUrl) throw new Error("CLASS_SESSION_URL no está configurada.");
  const intro = timing === "1h"
    ? "Falta una hora. Guarda este correo: aquí está tu acceso personal a la sala."
    : "Comenzamos en 10 minutos. Usa este enlace para entrar a la clase.";
  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: timing === "1h" ? "Tu enlace de Zoom · comenzamos en una hora" : "Comenzamos en 10 minutos · entra aquí",
    html: shell(timing === "1h" ? "Tu sala está lista" : "Comenzamos en 10 minutos", `<p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 28px;">${intro}</p>${classDetailsHtml()}${sessionBlock()}<p style="color:#A8A29E;font-size:14px;line-height:1.7;margin:0 0 28px;">Llega 5 minutos antes, ten a mano tu computador y revisa que puedas usar audio. Los cuatro ebooks y la guía se mantienen disponibles para ti.</p>`, "Si necesitas ayuda, responde este correo."),
  });
}

export async function sendClassOrganizerReminder({
  timing,
  paidCount,
  sentCount,
  sessionReady,
}: {
  timing: "1h" | "10m" | "blocked";
  paidCount: number;
  sentCount: number;
  sessionReady: boolean;
}) {
  const recipient = process.env.CLASS_ORGANIZER_EMAIL?.trim() || "sergio@crececonia.cl";
  const label = timing === "1h" ? "Checklist: falta una hora" : timing === "10m" ? "Checklist: faltan 10 minutos" : "Acción requerida: falta la sala";
  const actions = timing === "1h"
    ? "El enlace se acaba de enviar por correo a los compradores. Confirma que Zoom abre, deja los materiales listos y revisa el listado de asistentes."
    : timing === "10m"
      ? "El enlace se reenvió por correo. Abre Zoom ahora, activa la sala de espera y deja el chat habilitado."
      : "Configura CLASS_SESSION_URL con el enlace de Zoom y vuelve a ejecutar el recordatorio. No se ha enviado ningún enlace de sala a compradores.";
  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: recipient,
    subject: label,
    html: shell(label, `<p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 28px;">${actions}</p>${classDetailsHtml()}<div style="border:1px solid #2B2B2C;border-radius:18px;padding:22px;margin:0 0 28px;"><p style="margin:0 0 8px;">Compradores pagados: <strong>${paidCount}</strong></p><p style="margin:0 0 8px;">Correos enviados en esta tanda: <strong>${sentCount}</strong></p><p style="margin:0;">Enlace de sala: <strong>${sessionReady ? "configurado" : "pendiente"}</strong></p></div>${groupBlock()}`, "Recordatorio automático del flujo de la clase."),
  });
}
