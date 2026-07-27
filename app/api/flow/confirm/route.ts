import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { determineTier, decrementCupo, type Tier } from "@/lib/ebook-pricing";
import { redeemDiscountCode } from "@/lib/discount-codes";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

const VALID_TIERS: Tier[] = ["super-early", "early", "regular"];

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface FlowPayment {
  status: number;
  email: string;
  amount: number;
  flowOrder: number;
  commerceOrder: string;
}

async function getPaymentStatus(token: string): Promise<FlowPayment | null> {
  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;
  const params = { apiKey, token };
  const s = flowSign(params, secretKey);
  const url = `${getFlowBase()}/payment/getStatus?apiKey=${apiKey}&token=${token}&s=${s}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const downloadUrl = `${SITE_URL}/api/ebook/download?email=${encodeURIComponent(email)}&token=${token}`;
  const redownloadUrl = `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/descargar`;

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: "Tu ebook: De cero a Claude en una semana",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p>
    <h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">¡Gracias por tu compra!</h1>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">Tu ebook <strong style="color:#F5F5F4;">De cero a Claude en una semana</strong> está listo. Hacé clic abajo para descargarlo.</p>
    <a href="${downloadUrl}" style="display:inline-block;background:#D9B36A;color:#0A0A0B;padding:14px 28px;text-decoration:none;font-size:14px;font-weight:500;border-radius:2px;margin-bottom:32px;">Descargar ebook →</a>
    <p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:0 0 40px;">Guardá este email. Si perdés el link, podés recuperarlo en <a href="${redownloadUrl}" style="color:#D9B36A;text-decoration:none;">${redownloadUrl}</a> ingresando tu email.</p>
    <hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;">
    <p style="color:#8C8C8C;font-size:12px;margin:0;">CrececonIA · Strimo SPA · Santiago, Chile</p>
  </div>
</body>
</html>`,
  });
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);
    const token = params.get("token");

    if (!token) return new Response("OK", { status: 200 });

    const payment = await getPaymentStatus(token);
    if (!payment || payment.status !== 2) return new Response("OK", { status: 200 });

    const db = getSupabaseAdmin();

    // Idempotency check
    const { data: existing } = await db
      .from("ebook_purchases")
      .select("id")
      .eq("flow_token", token)
      .maybeSingle();

    if (existing) return new Response("OK", { status: 200 });

    const commerceOrder = payment.commerceOrder ?? "";
    const { data: pending } = await db
      .from("ebook_pending_orders")
      .select("tier, discount_code")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    // Si no hay fila pendiente (orden creada antes de este cambio, o el
    // registro ya fue limpiado), se cae al método anterior de reconstruir
    // el tier desde el monto — correcto mientras no haya descuento aplicado.
    const pendingTier = pending?.tier as Tier | undefined;
    const tier = pendingTier && VALID_TIERS.includes(pendingTier) ? pendingTier : determineTier(payment.amount);
    const discountCode: string | null = pending?.discount_code ?? null;

    // Este insert es el guard de idempotencia real: ebook_purchases tiene un
    // índice único sobre flow_token, así que si Flow entrega el webhook dos
    // veces el segundo insert falla y cortamos acá. El SELECT de arriba es
    // solo un atajo — no es atómico, dos entregas simultáneas lo pasan las
    // dos. supabase-js NO lanza excepción en errores de query, por eso hay
    // que leer `error` explícitamente: sin esto seguíamos de largo y
    // duplicábamos cupo, canje del código y email para un solo pago.
    const { error: insertError } = await db.from("ebook_purchases").insert({
      email: payment.email,
      amount: payment.amount,
      flow_token: token,
      flow_order: payment.flowOrder,
      tier,
      discount_code: discountCode,
    });

    if (insertError) {
      console.error(
        `[flow/confirm] no se registró la compra del token ${token}:`,
        insertError.message
      );
      return new Response("OK", { status: 200 });
    }

    // Entregar el ebook es lo más importante para el comprador, así que va
    // antes que la contabilidad y cada paso se aísla: que falle el conteo de
    // cupos no puede dejar a alguien que ya pagó sin su descarga.
    try {
      await sendConfirmationEmail(payment.email, token);
    } catch (err) {
      console.error(`[flow/confirm] falló el email de ${payment.email}:`, err);
    }

    try {
      await decrementCupo(tier);
    } catch (err) {
      console.error(`[flow/confirm] falló el conteo de cupo (${tier}):`, err);
    }

    if (discountCode) {
      try {
        const redeemed = await redeemDiscountCode(discountCode);
        if (!redeemed) {
          console.error(
            `[flow/confirm] el código ${discountCode} ya no era canjeable al confirmar el pago del token ${token} — se cobró con descuento de todas formas`
          );
        }
      } catch (err) {
        console.error(`[flow/confirm] falló el canje de ${discountCode}:`, err);
      }
    }

    if (pending) {
      await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
    }
  } catch (err) {
    // Siempre respondemos 200 para que Flow no reintente indefinidamente,
    // pero dejamos rastro en los logs de Vercel.
    console.error("[flow/confirm] error inesperado:", err);
  }

  return new Response("OK", { status: 200 });
}
