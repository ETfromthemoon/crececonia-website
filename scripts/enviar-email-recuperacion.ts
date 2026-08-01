/**
 * Email de disculpa + link de descarga para un comprador cuya compra se cobró
 * pero no se entregó (ver scripts/recuperar-entregas.ts).
 *
 * Va aparte del email normal de confirmación (app/api/flow/confirm) porque el
 * tono es distinto: acá hay que reconocer la falla, no felicitar por la compra.
 *
 * El link apunta a la página de recuperación por email en vez de a un link
 * directo con token, porque la fila recuperada no tiene el token real de Flow
 * (Flow no lo expone en sus consultas).
 */
import { Resend } from "resend";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

export async function enviarEmailDeRecuperacion(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

  const urlDescarga = `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/descargar`;

  await new Resend(apiKey).emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Tu ebook (y una disculpa de mi parte)",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p>
    <h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">Te debo una disculpa</h1>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Compraste <strong style="color:#F5F5F4;">De cero a Claude en una semana</strong> y por un error nuestro el email con tu descarga nunca salió. El pago se procesó bien; la falla fue de nuestro lado y ya está corregida.
    </p>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">
      Acá está tu libro. Ingresá este mismo email y lo descargás al instante:
    </p>
    <p style="margin:0 0 32px;">
      <a href="${urlDescarga}" style="display:inline-block;background:#D9B36A;color:#0A0A0B;text-decoration:none;padding:14px 28px;border-radius:2px;font-weight:500;">Descargar mi ebook →</a>
    </p>
    <p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:0 0 40px;">
      Si algo no funciona, respondé este email y lo resuelvo personalmente. Gracias por la paciencia.
    </p>
    <hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;">
    <p style="color:#8C8C8C;font-size:12px;margin:0;">Sergio · CrececonIA · Strimo SPA · Santiago, Chile</p>
  </div>
</body>
</html>`,
  });
}
