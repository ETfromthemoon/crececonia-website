import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { determineTier, decrementCupo, type Tier } from "@/lib/ebook-pricing";
import { redeemDiscountCode } from "@/lib/discount-codes";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { captureServerEvent } from "@/lib/posthog-server";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Respuesta de `GET /payment/getStatus` de Flow.
 *
 * OJO con dos campos, que costaron una entrega no realizada:
 *
 * - El email del comprador viene en `payer`, NO en `email`. Este tipo
 *   declaraba `email` y el resto del archivo leía `payment.email`, que
 *   siempre era `undefined`: el insert en ebook_purchases fallaba, la orden
 *   quedaba pendiente y el comprador nunca recibía el libro pese a haber
 *   pagado.
 * - `amount` llega como string ("17900"), no como number.
 */
interface FlowPayment {
  status: number;
  payer: string;
  amount: string | number;
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
  // Ruta genérica: antes apuntaba a /ebook/de-cero-a-claude-en-una-semana/
  // descargar, así que quien compraba otro libro recibía un link que, además
  // de nombrar el libro equivocado, le entregaba el PDF equivocado.
  const redownloadUrl = `${SITE_URL}/ebook/descargar`;
  const isBundle = resources.length > 1;
  const linksHtml = resources.map((r) => downloadLinkHtml(r.resource, email, token)).join("");

  // El asunto también estaba fijo al libro 1: quien compraba "Claude a Nivel
  // Experto" recibía un email titulado "Tu ebook: De cero a Claude en una
  // semana".
  const singleTitle = getCatalogEntry(resources[0]?.resource ?? "")?.title;
  const subject = isBundle
    ? "Tus ebooks de CrececonIA"
    : `Tu ebook: ${singleTitle ?? "CrececonIA"}`;

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject,
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

    // Normalizamos acá los dos campos que Flow entrega distinto de lo que el
    // resto del archivo espera, así el resto del flujo trabaja con un email y
    // un monto ya sanos (ver el comentario de FlowPayment).
    const buyerEmail = payment.payer;
    const paidAmount = Number(payment.amount);

    if (!buyerEmail) {
      // Sin email no hay a quién entregar. Antes esto seguía de largo con
      // `undefined` y se descubría recién cuando el comprador reclamaba.
      console.error(
        `[flow/confirm] Flow no devolvió 'payer' para el token ${token} — no se puede entregar. Respuesta:`,
        JSON.stringify(payment)
      );
      return new Response("OK", { status: 200 });
    }

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
        tier: determineTier(paidAmount, DEFAULT_EBOOK_RESOURCE),
        amount: paidAmount,
      },
    ];
    const discountCode: string | null = pending?.discount_code ?? null;

    const fulfilled: PendingResource[] = [];
    // Si algún insert falla por una razón real (no por ya existir), no
    // borramos la orden pendiente: sin ella, un reintento del webhook cae al
    // fallback legado de 1 solo libro, que reconstruye mal un combo (asume
    // DEFAULT_EBOOK_RESOURCE y el monto completo). Mejor dejar la fila viva
    // para que el próximo reintento de Flow pueda completar lo que falta.
    let allResolved = true;

    for (const item of resources) {
      // Idempotencia por flow_order, no por flow_token: flow_order es el id
      // estable del pago en Flow y es el mismo dato que usa la recuperación
      // manual de compras no entregadas (scripts/recuperar-entregas.ts), que
      // no puede conocer el token porque Flow no lo expone en sus consultas.
      // Chequear por token dejaba pasar un duplicado si el webhook llegaba
      // después de una recuperación. El índice único (flow_token, resource)
      // sigue siendo la protección real contra dobles webhooks.
      const { data: existing } = await db
        .from("ebook_purchases")
        .select("id")
        .eq("flow_order", payment.flowOrder)
        .eq("resource", item.resource)
        .maybeSingle();
      if (existing) continue;

      // supabase-js NO lanza excepción en errores de query, por eso hay que
      // leer `error` explícitamente: sin esto seguíamos de largo y
      // duplicábamos cupo/email para una fila que nunca se guardó.
      const { error: insertError } = await db.from("ebook_purchases").insert({
        email: buyerEmail,
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
        allResolved = false;
        continue;
      }

      fulfilled.push(item);
    }

    if (fulfilled.length > 0) {
      // Entregar el ebook es lo más importante para el comprador, así que va
      // antes que la contabilidad y cada paso se aísla: que falle el conteo
      // de cupos no puede dejar a alguien que ya pagó sin su descarga.
      try {
        await sendConfirmationEmail(buyerEmail, token, fulfilled);
      } catch (err) {
        console.error(`[flow/confirm] falló el email de ${buyerEmail}:`, err);
      }

      for (const item of fulfilled) {
        try {
          await decrementCupo(item.resource, item.tier);
        } catch (err) {
          console.error(`[flow/confirm] falló el conteo de cupo (${item.resource}/${item.tier}):`, err);
        }

        captureServerEvent("ebook_purchase_confirmed", buyerEmail, {
          resource: item.resource,
          amount: item.amount,
          item_count: fulfilled.length,
          discount_code: discountCode,
        }).catch((err) =>
          console.error(`[flow/confirm] falló el evento de PostHog para ${item.resource}:`, err)
        );
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
    }

    // Solo borramos la orden pendiente cuando cada libro del combo quedó
    // resuelto (ya existía o se insertó recién) — nunca cuando alguno falló
    // de verdad, para no perder la única copia del detalle del combo.
    if (pending && allResolved) {
      await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
    }
  } catch (err) {
    // Siempre respondemos 200 para que Flow no reintente indefinidamente,
    // pero dejamos rastro en los logs de Vercel.
    console.error("[flow/confirm] error inesperado:", err);
  }

  return new Response("OK", { status: 200 });
}
