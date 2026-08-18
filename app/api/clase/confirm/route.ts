import { getSupabaseAdmin } from "@/lib/supabase";
import { flowSign, getFlowBase } from "@/lib/flow";
import { CLASS_PRODUCT_KEY } from "@/lib/class-product";
import { sendClassAccessEmail } from "@/lib/class-delivery-email";

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

    const commerce = getSupabaseAdmin().schema("commerce");
    const { data: order, error: orderError } = await commerce
      .from("class_orders")
      .select("id,product_id,offer_id,email,amount_minor,status,email_sent_at")
      .eq("commerce_order", commerceOrder)
      .maybeSingle();
    if (orderError) return retry(`no se pudo leer la orden ${commerceOrder}`, orderError.message);
    if (!order) return retry(`pago sin orden ${commerceOrder}`);

    if (order.product_id !== (await commerce.from("products").select("id").eq("product_key", CLASS_PRODUCT_KEY).maybeSingle()).data?.id) {
      return retry(`producto incorrecto en ${commerceOrder}`);
    }
    if (order.amount_minor !== paidAmount || order.email.toLowerCase() !== payment.payer.toLowerCase()) {
      return retry(`el pago no coincide con la orden ${commerceOrder}`);
    }

    const { data: finalized, error: finalizeError } = await commerce.rpc("finalize_class_order", {
      p_commerce_order: commerceOrder,
      p_flow_token: token,
      p_flow_order: payment.flowOrder,
      p_paid_amount: paidAmount,
    });
    if (finalizeError || finalized !== true) return retry(`no se pudo confirmar ${commerceOrder}`, finalizeError?.message);

    const { data: offer, error: offerError } = await commerce
      .from("product_offers")
      .select("label")
      .eq("id", order.offer_id)
      .maybeSingle();
    if (offerError || !offer) return retry(`no se pudo leer el tramo ${commerceOrder}`, offerError?.message);

    if (!order.email_sent_at) {
      try {
        await sendClassAccessEmail({ email: order.email, offerLabel: offer.label, amount: paidAmount, orderId: commerceOrder });
      } catch (error) {
        return retry(`no se pudo enviar la confirmación de ${commerceOrder}`, error);
      }
      const { error: emailUpdateError } = await commerce
        .from("class_orders")
        .update({ email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", order.id)
        .is("email_sent_at", null);
      if (emailUpdateError) return retry(`no se pudo cerrar la entrega de ${commerceOrder}`, emailUpdateError.message);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return retry("error inesperado", error);
  }
}
