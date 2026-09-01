import { deliverLateWorkshopAccessIfNeeded, deliverWorkshopOrders } from "@/lib/workshop-delivery";
import { flowSign, getFlowBase } from "@/lib/flow";
import { captureServerEvent } from "@/lib/posthog-server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";

type FlowPayment = { status: number; payer: string; amount: string | number; flowOrder: number; commerceOrder: string };

async function paymentStatus(token: string): Promise<FlowPayment | null> {
  const apiKey = process.env.FLOW_API_KEY, secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) return null;
  const signature = flowSign({ apiKey, token }, secretKey);
  const response = await fetch(`${getFlowBase()}/payment/getStatus?apiKey=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(token)}&s=${encodeURIComponent(signature)}`);
  return response.ok ? response.json() : null;
}

const retry = (message: string, reason?: unknown) => { console.error(`[workshop/confirm] ${message}`, reason ?? ""); return new Response("RETRY", { status: 500 }); };

export async function POST(request: Request) {
  try {
    const token = new URLSearchParams(await request.text()).get("token");
    if (!token) return new Response("OK");
    const payment = await paymentStatus(token);
    if (!payment || payment.status !== 2) return new Response("OK");
    const paidAmount = Number(payment.amount), commerceOrder = payment.commerceOrder ?? "";
    if (!payment.payer || !Number.isSafeInteger(paidAmount) || !commerceOrder.startsWith("workshop-")) return retry("Respuesta inválida de Flow");
    const db = getSupabaseAdmin();
    const { data: orderRows, error: orderError } = await db.rpc("get_workshop_order", { p_commerce_order: commerceOrder, p_product_key: WORKSHOP_PRODUCT_KEY });
    const order = orderRows?.[0];
    if (orderError || !order) return retry("Orden no encontrada o producto incorrecto", orderError?.message);
    if (order.amount_minor !== paidAmount || order.email.toLowerCase() !== payment.payer.toLowerCase()) return retry("El pago no coincide con la orden");
    const { data: finalized, error } = await db.rpc("finalize_class_order", { p_commerce_order: commerceOrder, p_flow_token: token, p_flow_order: payment.flowOrder, p_paid_amount: paidAmount });
    if (error || finalized !== true) return retry("No se pudo confirmar la orden", error?.message);
    try { await deliverWorkshopOrders("welcome", commerceOrder); await deliverWorkshopOrders("ebooks", commerceOrder); await deliverWorkshopOrders("admin-notification", commerceOrder); await deliverLateWorkshopAccessIfNeeded(commerceOrder); }
    catch (reason) { return retry("No se pudo completar la entrega", reason); }
    captureServerEvent("workshop_purchase_confirmed", payment.payer.toLowerCase(), { product: WORKSHOP_PRODUCT_KEY, amount: paidAmount, order_id: commerceOrder, flow_order: payment.flowOrder }).catch((reason) => console.error("[workshop/confirm] analytics", reason));
    return new Response("OK");
  } catch (reason) { return retry("Error inesperado", reason); }
}
