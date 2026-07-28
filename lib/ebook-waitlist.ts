import { Resend } from "resend";
import { getSupabaseAdmin } from "./supabase";

const UNIQUE_VIOLATION = "23505";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface WaitlistParams {
  email: string;
  resource: string;
  source?: string;
}

async function sendWaitlistConfirmation(email: string): Promise<void> {
  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Listo — te avisamos apenas esté disponible",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p>
    <h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">Listo, quedaste anotado.</h1>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">Te vamos a avisar a este mismo correo apenas el ebook esté disponible para comprar. No hace falta que hagas nada más.</p>
    <hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;">
    <p style="color:#8C8C8C;font-size:12px;margin:0;">CrececonIA · Strimo SPA · Santiago, Chile</p>
  </div>
</body>
</html>`,
  });
}

/**
 * Guarda el email en la waitlist propia (tabla ebook_waitlist en Supabase) y
 * confirma por correo vía Resend. Reemplaza el POST previo a
 * autodrive.cl/api/public/subscribe: estos leads quedan en nuestra base, no
 * en la de Autodrive, y no se usan para nada más que avisar el lanzamiento.
 *
 * Un mismo email puede reintentar el submit (doble click, retry de red) o
 * suscribirse dos veces al mismo recurso — la tabla tiene un unique(email,
 * resource), así que ese insert falla con 23505 y lo tratamos como éxito en
 * vez de propagar el error.
 */
export async function addToWaitlist({ email, resource, source }: WaitlistParams): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("ebook_waitlist").insert({
    email,
    resource,
    source: source ?? null,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    throw new Error(error.message);
  }

  // La fila ya quedó guardada, que es lo que importa para el lanzamiento —
  // si el correo de confirmación falla no lo tratamos como error del request.
  try {
    await sendWaitlistConfirmation(email);
  } catch (err) {
    console.error(`[ebook-waitlist] no se pudo enviar la confirmación a ${email}:`, err);
  }
}
