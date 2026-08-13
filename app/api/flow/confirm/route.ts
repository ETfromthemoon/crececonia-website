import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { decrementCupo, type Tier } from "@/lib/ebook-pricing";
import { redeemDiscountCode } from "@/lib/discount-codes";
import { sendEbookDeliveryEmail } from "@/lib/ebook-delivery-email";
import { getOfferIdForResources } from "@/lib/ebook-offers";
import { getComboDiscountPercent } from "@/lib/ebook-bundles";
import { captureServerEvent } from "@/lib/posthog-server";

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
  analytics_distinct_id?: string;
  pricing_variant?: string;
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

function isPendingResource(value: unknown): value is PendingResource {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.resource === "string" &&
    typeof item.tier === "string" &&
    typeof item.amount === "number" &&
    Number.isSafeInteger(item.amount) &&
    item.amount > 0
  );
}

function retry(message: string, error?: unknown): Response {
  console.error(`[flow/confirm] ${message}`, error ?? "");
  // Una orden incompleta debe quedar pendiente para que Flow pueda reintentar;
  // nunca se responde OK fingiendo que ya fue entregada.
  return new Response("RETRY", { status: 500 });
}

export async function POST(request: Request) {
  try {
    const params = new URLSearchParams(await request.text());
    const token = params.get("token");
    if (!token) return new Response("OK", { status: 200 });

    const payment = await getPaymentStatus(token);
    if (!payment || payment.status !== 2) return new Response("OK", { status: 200 });

    const buyerEmail = payment.payer;
    const paidAmount = Number(payment.amount);
    if (!buyerEmail || !Number.isSafeInteger(paidAmount) || paidAmount <= 0) {
      return retry(`respuesta inválida de Flow para token ${token}`);
    }

    const db = getSupabaseAdmin();
    const commerceOrder = payment.commerceOrder ?? "";
    const { data: pending, error: pendingError } = await db
      .from("ebook_pending_orders")
      .select("resources, discount_code")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();

    if (pendingError) return retry(`no se pudo leer el manifiesto ${commerceOrder}`, pendingError.message);

    if (!pending) {
      // Si el webhook llega tarde después de una entrega correcta, la orden ya
      // no existe pero sus compras sí. En cualquier otro caso es inseguro
      // adivinar qué ebook se cobró.
      const { data: existing, error } = await db
        .from("ebook_purchases")
        .select("id")
        .eq("flow_order", payment.flowOrder)
        .limit(1);
      if (error) return retry(`no se pudo revisar la idempotencia ${commerceOrder}`, error.message);
      if (existing && existing.length > 0) return new Response("OK", { status: 200 });
      return retry(`pago sin manifiesto de entrega ${commerceOrder}`);
    }

    const resources = Array.isArray(pending.resources)
      ? pending.resources.filter(isPendingResource)
      : [];
    const expectedAmount = resources.reduce((sum, item) => sum + item.amount, 0);
    if (resources.length === 0 || resources.length !== pending.resources.length || expectedAmount !== paidAmount) {
      return retry(`el manifiesto no coincide con el pago ${commerceOrder}`);
    }

    const discountCode: string | null = pending.discount_code ?? null;
    const inserted: PendingResource[] = [];

    for (const item of resources) {
      const { data: existing, error: existingError } = await db
        .from("ebook_purchases")
        .select("id")
        .eq("flow_order", payment.flowOrder)
        .eq("resource", item.resource)
        .maybeSingle();
      if (existingError) return retry(`no se pudo revisar ${item.resource}`, existingError.message);
      if (existing) continue;

      const { error: insertError } = await db.from("ebook_purchases").insert({
        email: buyerEmail,
        resource: item.resource,
        amount: item.amount,
        flow_token: token,
        flow_order: payment.flowOrder,
        tier: item.tier,
        discount_code: resources.length === 1 ? discountCode : null,
      });
      if (insertError) return retry(`no se registró ${item.resource}`, insertError.message);
      inserted.push(item);
    }

    // Cada fila nueva consume exactamente un cupo. Este paso es aislado de la
    // entrega para no negar una descarga a una compra ya registrada.
    for (const item of inserted) {
      try {
        await decrementCupo(item.resource, item.tier);
      } catch (err) {
        console.error(`[flow/confirm] falló el cupo ${item.resource}/${item.tier}:`, err);
      }
    }

    try {
      await sendEbookDeliveryEmail({
        email: buyerEmail,
        grants: resources.map((item) => ({ resource: item.resource, token })),
      });
    } catch (err) {
      return retry(`no se pudo enviar la entrega de ${commerceOrder}`, err);
    }

    if (discountCode && resources.length === 1 && inserted.length > 0) {
      try {
        const redeemed = await redeemDiscountCode(discountCode);
        if (!redeemed) console.error(`[flow/confirm] el código ${discountCode} ya no era canjeable.`);
      } catch (err) {
        console.error(`[flow/confirm] falló el canje de ${discountCode}:`, err);
      }
    }

    const analyticsDistinctId = resources.find((item) => item.analytics_distinct_id)?.analytics_distinct_id;
    try {
      await captureServerEvent("ebook_purchase_confirmed", analyticsDistinctId ?? buyerEmail, {
        resource: resources[0].resource,
        resources: resources.map((item) => item.resource),
        item_count: resources.length,
        amount: paidAmount,
        discount_code: discountCode,
        discount_percent: getComboDiscountPercent(resources.length),
        offer_id: getOfferIdForResources(resources.map((item) => item.resource)),
        order_id: commerceOrder,
        pricing_variant: resources.find((item) => item.pricing_variant)?.pricing_variant,
      });
    } catch (err) {
      console.error("[flow/confirm] falló el evento de PostHog:", err);
    }

    const { error: deleteError } = await db
      .from("ebook_pending_orders")
      .delete()
      .eq("commerce_order", commerceOrder);
    if (deleteError) return retry(`no se pudo cerrar ${commerceOrder}`, deleteError.message);

    return new Response("OK", { status: 200 });
  } catch (err) {
    return retry("error inesperado", err);
  }
}
