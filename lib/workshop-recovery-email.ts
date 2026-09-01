import "server-only";
import { Resend } from "resend";
import { WORKSHOP_TITLE } from "./workshop-product";

const button = "display:inline-block;background:#c6ee35;color:#101112;padding:15px 20px;text-decoration:none;font-weight:800;";
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] ?? char));

export async function sendWorkshopRecoveryEmail({
  email,
  originalAmount,
  discountedAmount,
  recoveryUrl,
}: {
  email: string;
  originalAmount: number;
  discountedAmount: number;
  recoveryUrl: string;
}) {
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Tienes 10% de descuento para completar tu inscripción",
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#101111;color:#f2eee4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0"><div style="max-width:560px;margin:auto;padding:48px 24px"><p style="color:#c6ee35;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 34px">CrececonIA · Workshop</p><h1 style="font-size:28px;line-height:1.15;margin:0 0 18px">Tu inscripción quedó a un paso.</h1><p style="color:#b4b5b0;line-height:1.7">Iniciaste el pago de <strong style="color:#fff">${escapeHtml(WORKSHOP_TITLE)}</strong>, pero no alcanzó a completarse. Si todavía quieres entrar, dejamos un <strong style="color:#c6ee35">10% de descuento</strong> aplicado a tu nuevo pago.</p><div style="border:1px solid #303231;padding:20px;margin:26px 0"><span style="color:#8b8d87;text-decoration:line-through">Antes: $${originalAmount.toLocaleString("es-CL")} CLP</span><strong style="display:block;color:#fff;font-size:24px;margin-top:7px">Ahora: $${discountedAmount.toLocaleString("es-CL")} CLP</strong></div><p style="margin:28px 0"><a href="${escapeHtml(recoveryUrl)}" style="${button}">Continuar directamente al pago →</a></p><p style="color:#b4b5b0;line-height:1.7">El enlace estará disponible durante 48 horas. Si ya completaste la compra desde otro enlace, puedes ignorar este correo.</p><hr style="border:0;border-top:1px solid #303231;margin:32px 0 20px"><p style="color:#7f817c;font-size:12px;line-height:1.6">Recibiste este mensaje porque ingresaste tu correo e iniciaste el pago en CrececonIA. Si necesitas ayuda, responde este correo.</p></div></body></html>`,
  });
  if (error || !data?.id) throw new Error(error?.message ?? "Resend no confirmó el correo de recuperación.");
  return data.id;
}
