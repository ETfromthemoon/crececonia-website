import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { determineTier, decrementCupo, type Tier } from "@/lib/ebook-pricing";
import { redeemDiscountCode } from "@/lib/discount-codes";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

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

interface PendingResource {
  resource: string;
  tier: Tier;
  amount: number;
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

function downloadLinkHtml(resource: string, email: string, token: string): string {
  const entry = getCatalogEntry(resource);
  const title = entry?.title ?? resource;
  const downloadUrl = `${SITE_URL}/api/ebook/download?email=${encodeURIComponent(email)}&token=${token}&resource=${encodeURIComponent(resource)}`;
  return `<p style="margin:0 0 16px;"><strong style="color:#F5F5F4;">${title}</strong><br/><a href="${downloadUrl}" style="color:#D9B36A;">Descargar →</a></p>`;
}

async function sendConfirmationEmail(
  email: string,
  token: string,
  resources: PendingResource[]
): Promise<void> {
  const redownloadUrl = `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/descargar`;
  const isBundle = resources.length > 1;
  const linksHtml = resources.map((r) => downloadLinkHtml(r.resource, email, token)).join("");

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject: isBundle ? "Tus ebooks de CrececonIA" : "Tu ebook: De cero a Claude en una semana",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p>
    <h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">¡Gracias por tu compra!</h1>
    <p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">
      ${isBundle ? "Tus ebooks están listos. Hacé clic en cada uno para descargarlo." : "Tu ebook está listo. Hacé clic abajo para descargarlo."}
    </p>
    ${linksHtml}
    <p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:24px 0 40px;">Guardá este email. Si perdés el link, podés recuperarlo en <a href="${redownloadUrl}" style="color:#D9B36A;text-decoration:none;">${redownloadUrl}</a> ingresando tu email.</p>
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
    const commerceOrder = payment.commerceOrder ?? "";

    const { data: pending } = await db
      .from("ebook_pending_orders")
      .select("resources, discount_code")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    // Sin fila pendiente (orden previa a este cambio, o el insert falló al
    // crear la orden): fallback al comportamiento legado de 1 solo libro,
    // reconstruyendo el tier desde el monto pagado.
    const resources: PendingResource[] = pending?.resources ?? [
      {
        resource: DEFAULT_EBOOK_RESOURCE,
        tier: determineTier(payment.amount, DEFAULT_EBOOK_RESOURCE),
        amount: payment.amount,
      },
    ];
    const discountCode: string | null = pending?.discount_code ?? null;

    const fulfilled: PendingResource[] = [];

    for (const item of resources) {
      // Atajo de idempotencia (no atómico) — el índice único (flow_token,
      // resource) en el insert de abajo es la protección real.
      const { data: existing } = await db
        .from("ebook_purchases")
        .select("id")
        .eq("flow_token", token)
        .eq("resource", item.resource)
        .maybeSingle();
      if (existing) continue;

      // supabase-js NO lanza excepción en errores de query, por eso hay que
      // leer `error` explícitamente: sin esto seguíamos de largo y
      // duplicábamos cupo/email para una fila que nunca se guardó.
      const { error: insertError } = await db.from("ebook_purchases").insert({
        email: payment.email,
        resource: item.resource,
        amount: item.amount,
        flow_token: token,
        flow_order: payment.flowOrder,
        tier: item.tier,
        discount_code: resources.length === 1 ? discountCode : null,
      });

      if (insertError) {
        console.error(
          `[flow/confirm] no se registró la compra de ${item.resource} para el token ${token}:`,
          insertError.message
        );
        continue;
      }

      fulfilled.push(item);
    }

    if (fulfilled.length === 0) {
      // Todo el combo ya estaba confirmado (replay), o cada insert falló —
      // en ambos casos no hay nada nuevo que entregar.
      if (pending) await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
      return new Response("OK", { status: 200 });
    }

    // Entregar el ebook es lo más importante para el comprador, así que va
    // antes que la contabilidad y cada paso se aísla: que falle el conteo de
    // cupos no puede dejar a alguien que ya pagó sin su descarga.
    try {
      await sendConfirmationEmail(payment.email, token, fulfilled);
    } catch (err) {
      console.error(`[flow/confirm] falló el email de ${payment.email}:`, err);
    }

    for (const item of fulfilled) {
      try {
        await decrementCupo(item.resource, item.tier);
      } catch (err) {
        console.error(`[flow/confirm] falló el conteo de cupo (${item.resource}/${item.tier}):`, err);
      }
    }

    if (discountCode && resources.length === 1 && fulfilled.length === 1) {
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
