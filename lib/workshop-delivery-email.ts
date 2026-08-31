import "server-only";
import { Resend } from "resend";
import { createWorkshopAccessToken } from "./workshop-access";
import { WORKSHOP_ROOM_PATH, WORKSHOP_SESSION_LABEL, WORKSHOP_TITLE, isWorkshopRecordingOnSale } from "./workshop-product";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";
const button = "display:inline-block;background:#c6ee35;color:#101112;padding:14px 19px;text-decoration:none;font-weight:800;";

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));
const shell = (title: string, body: string, footer: string) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#101111;color:#f2eee4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0"><div style="max-width:560px;margin:auto;padding:48px 24px"><p style="color:#c6ee35;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 36px">CrececonIA · Workshop en vivo</p><h1 style="font-size:28px;line-height:1.15;margin:0 0 18px">${title}</h1>${body}<hr style="border:0;border-top:1px solid #303231;margin:32px 0 20px"><p style="color:#7f817c;font-size:12px;line-height:1.6">${footer}</p></div></body></html>`;

async function send(to: string, subject: string, html: string) {
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: "CrececonIA <sergio@crececonia.cl>", to, subject, html });
  if (error || !data?.id) throw new Error(error?.message ?? "Resend no confirmó el envío.");
  return data.id;
}

function roomButton(orderId: string) {
  const token = createWorkshopAccessToken(orderId);
  if (!token) throw new Error("WORKSHOP_ACCESS_SECRET no está configurado.");
  const href = `${SITE_URL}${WORKSHOP_ROOM_PATH}?token=${encodeURIComponent(token)}`;
  return `<p style="margin:28px 0"><a href="${escapeHtml(href)}" style="${button}">Abrir mi sala privada →</a></p>`;
}

export function sendWorkshopWelcomeEmail({ email, amount, orderId }: { email: string; amount: number; orderId: string }) {
  const recording = isWorkshopRecordingOnSale();
  const title = recording ? "Tu clase grabada y sala privada · Workshop CrececonIA" : "Tu entrada y sala privada · Workshop CrececonIA";
  const heading = recording ? "Tu acceso está confirmado." : "Tu entrada está confirmada.";
  const accessCopy = recording ? "el enlace de abajo es tu acceso personal a la grabación y los recursos" : "el enlace de abajo es tu acceso personal antes y después del workshop";
  const roomCopy = recording ? "En la sala encontrarás la grabación, el pack de cinco skills y la invitación a SKOOL. Tus dos ebooks llegarán en un segundo correo." : "En la sala aparecerán el enlace en vivo, la grabación, el pack de cinco skills y la invitación a SKOOL cuando cada recurso esté disponible. Tus dos ebooks llegarán en un segundo correo.";
  return send(email, title, shell(heading, `<p style="color:#b4b5b0;line-height:1.7">Recibimos tu pago de <strong style="color:#fff">$${amount.toLocaleString("es-CL")} CLP</strong>. Guarda este correo: ${accessCopy}.</p><div style="border:1px solid #303231;padding:20px;margin:26px 0"><strong>${escapeHtml(WORKSHOP_TITLE)}</strong><p style="color:#c6ee35;margin:8px 0 0">${recording ? "Clase grabada · acceso inmediato" : escapeHtml(WORKSHOP_SESSION_LABEL)}</p></div>${roomButton(orderId)}<p style="color:#b4b5b0;line-height:1.7">${roomCopy}</p>`, `Orden: ${escapeHtml(orderId)} · Si necesitas ayuda, responde este correo.`));
}

export function sendWorkshopSessionEmail({ email, orderId, timing }: { email: string; orderId: string; timing: "1h" | "10m" | "late" }) {
  const label = timing === "1h" ? "Comenzamos en una hora" : timing === "10m" ? "Comenzamos en 10 minutos" : "Tu acceso está listo";
  return send(email, `${label} · Workshop CrececonIA`, shell(label, `<p style="color:#b4b5b0;line-height:1.7">Entra a tu sala privada para abrir el enlace de la sesión. Te recomendamos conectarte cinco minutos antes.</p>${roomButton(orderId)}`, "Tu acceso es personal. Si necesitas ayuda, responde este correo."));
}

export function sendWorkshopFollowUpEmail({ email, orderId }: { email: string; orderId: string }) {
  return send(email, "Grabación y recursos · Workshop CrececonIA", shell("Tu workshop continúa aquí.", `<p style="color:#b4b5b0;line-height:1.7">Vuelve a tu sala para revisar la grabación, descargar las cinco skills, entrar a la comunidad SKOOL y recuperar los materiales.</p>${roomButton(orderId)}`, "Guarda este correo junto con tus ebooks."));
}
