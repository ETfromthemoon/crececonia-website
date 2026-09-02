import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { deliverClassOrders, deliverLateClassAccessIfNeeded } from "@/lib/class-delivery";
import { CLASS_PATH, CLASS_PRODUCT_KEY } from "@/lib/class-product";
import { captureServerEvent } from "@/lib/posthog-server";
import { sendPurchaseNotification } from "@/lib/purchase-notification-email";
import { captureMetaPurchase } from "@/lib/meta-conversions-api";

interface FlowPayment {
  status: number;
  payer: string;
  amount: string | number;
  flowOrder: number;
  commerceOrder: string;
}

async function getPaymentStatus(token: string): Promise<FlowPayment | null> {
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) return null;
  const params = { apiKey, token };
  const signature = flowSign(params, secretKey);
  const response = await fetch(`${getFlowBase()}/payment/getStatus?apiKey=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}&s=${encodeURIComponent(signature)}`);
  if (!response.ok) return null;
  return response.json();
}

function retry(message: string, error?: unknown): Response {
  console.error(`[class/confirm] ${message}`, error ?? "");
  return new Response("RETRY", { status: 500 });
}

export async function POST(request: Request) {
  try {
    const params = new URLSearchParams(await request.text());
    const token = params.get("token");
    if (!token) return new Response("OK", { status: 200 });

    const payment = await getPaymentStatus(token);
    if (!payment || payment.status !== 2) return new Response("OK", { status: 200 });
    const paidAmount = Number(payment.amount);
    const commerceOrder = payment.commerceOrder ?? "";
    if (!payment.payer || !Number.isSafeInteger(paidAmount) || paidAmount <= 0 || !commerceOrder.startsWith("class-")) {
      return retry("respuesta inválida de Flow");
    }

    const db = getSupabaseAdmin();
    const { data: orderRows, error: orderError } = await db.rpc("get_class_order", { p_commerce_order: commerceOrder });
    const order = orderRows?.[0];
    if (orderError) return retry(`no se pudo leer la orden ${commerceOrder}`, orderError.message);
    if (!order) return retry(`pago sin orden ${commerceOrder}`);

    if (order.amount_minor !== paidAmount || order.email.toLowerCase() !== payment.payer.toLowerCase()) {
      return retry(`el pago no coincide con la orden ${commerceOrder}`);
    }

    const { data: finalized, error: finalizeError } = await db.rpc("finalize_class_order", {
      p_commerce_order: commerceOrder,
      p_flow_token: token,
      p_flow_order: payment.flowOrder,
      p_paid_amount: paidAmount,
    });
    if (finalizeError || finalized !== true) return retry(`no se pudo confirmar ${commerceOrder}`, finalizeError?.message);

    try {
      await deliverClassOrders("welcome", commerceOrder);
      await deliverClassOrders("ebooks", commerceOrder);
      await deliverLateClassAccessIfNeeded(commerceOrder);
    } catch (error) {
      return retry(`no se pudo enviar la entrega de ${commerceOrder}`, error);
    }

    try {
      await sendPurchaseNotification({
        kind: "Clase en vivo",
        buyerEmail: order.email,
        amount: paidAmount,
        orderId: commerceOrder,
        items: ["Construye una página desde cero con inteligencia artificial", order.offer_label],
      });
    } catch (error) {
      console.error(`[class/confirm] no se pudo notificar la compra ${commerceOrder}:`, error);
    }

    try {
      await captureServerEvent("class_purchase_confirmed", payment.payer.toLowerCase(), {
        product: CLASS_PRODUCT_KEY,
        amount: paidAmount,
        order_id: commerceOrder,
        flow_order: payment.flowOrder,
      });
    } catch (error) {
      // La analítica no debe hacer que Flow reintente una entrega ya realizada.
      console.error(`[class/confirm] falló el evento de PostHog para ${commerceOrder}`, error);
    }

    try {
      await captureMetaPurchase({
        email: payment.payer,
        amount: paidAmount,
        orderId: commerceOrder,
        productId: CLASS_PRODUCT_KEY,
        eventSourcePath: CLASS_PATH,
        request,
      });
    } catch (error) {
      // Meta nunca debe hacer que Flow reintente una compra ya entregada.
      console.error(`[class/confirm] falló el evento de Meta para ${commerceOrder}`, error);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return retry("error inesperado", error);
  }
}
