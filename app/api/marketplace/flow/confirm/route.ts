import { createHash } from "node:crypto";
import { queryDatabase } from "@/lib/database";
import { flowSign, getFlowBase } from "@/lib/flow";
import { deliverMarketplaceOrder } from "@/lib/marketplace-delivery-worker";
import { marketplaceCallbackConfigured, marketplaceFlowGatewayFee, normalizeBuyerEmail, MARKETPLACE_FLOW_ACCOUNT_REF } from "@/lib/marketplace-checkout";

export const runtime = "nodejs";

type FlowStatus = {
  status: number; payer: string; amount: string | number; flowOrder: number; commerceOrder: string;
  currency: string; merchantId?: string | null; paymentData?: unknown;
};
type OrderRow = {
  id: string; buyer_email: string; status: string; total_minor: string | number;
  item_id: string; price_minor: string | number; commission_minor: string | number;
  title: string; paid_at: string | null;
};

async function getFlowStatus(token: string): Promise<FlowStatus> {
  const apiKey = process.env.FLOW_API_KEY!;
  const params = { apiKey, token };
  const url = new URL(`${getFlowBase()}/payment/getStatus`);
  for (const [key, value] of Object.entries({ ...params, s: flowSign(params, process.env.FLOW_SECRET_KEY!) })) url.searchParams.set(key, value);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Flow no confirmó el estado de pago.");
  const payment: unknown = await response.json();
  if (!payment || typeof payment !== "object" || !("status" in payment) || typeof payment.status !== "number" || ![1, 2, 3, 4].includes(payment.status)) {
    throw new Error("Estado de Flow inválido.");
  }
  return payment as FlowStatus;
}

export async function POST(request: Request): Promise<Response> {
  // Disabling new checkouts must not abandon an already paid Flow order.
  if (!marketplaceCallbackConfigured()) return new Response("UNAVAILABLE", { status: 503 });
  try {
    const params = new URLSearchParams(await request.text());
    const token = params.get("token");
    if (!token || token.length > 500) return new Response("BAD REQUEST", { status: 400 });
    const payment = await getFlowStatus(token);
    if (payment.status !== 2) return new Response("OK");
    const match = /^mkt-([0-9a-f-]{36})$/.exec(payment.commerceOrder ?? "");
    const buyer = normalizeBuyerEmail(payment.payer);
    const amount = Number(payment.amount);
    if (!match || !buyer || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(payment.flowOrder)
      || payment.currency !== "CLP" || payment.merchantId != null) {
      throw new Error("Flow devolvió un pago sin identidad o monto válido.");
    }
    const orderId = match[1];
    const [order] = await queryDatabase<OrderRow>(`
      select o.id,o.buyer_email,o.status,o.total_minor,o.paid_at,i.id as item_id,
             i.price_minor,i.commission_minor,r.title
      from public.marketplace_orders o
      join public.marketplace_order_items i on i.order_id=o.id
      join public.marketplace_book_revisions r on r.id=i.revision_id
      where o.id=$1`, [orderId]);
    if (!order || Number(order.total_minor) !== amount || Number(order.price_minor) !== amount || order.buyer_email !== buyer) {
      throw new Error("El pago no coincide con la orden preparada.");
    }
    const [existing] = await queryDatabase<{ id: string; provider_payment_ref: string; provider_account_ref: string; status: string }>(`
      select id,provider_payment_ref,provider_account_ref,status from public.marketplace_payments
      where order_id=$1 and attempt_number=1`, [orderId]);
    // Flow can notify before payment/create's response is persisted; retry without
    // moving the order to manual review until that write has had a chance to land.
    if (!existing) throw new Error("La referencia Flow aún no está registrada; reintentar.");
    if (existing.provider_payment_ref !== token || existing.provider_account_ref !== MARKETPLACE_FLOW_ACCOUNT_REF) {
      await queryDatabase("update public.marketplace_orders set status='review_required' where id=$1 and status in ('pending','paid')", [orderId]);
      throw new Error("La transacción o cuenta Flow no coincide con la orden preparada y requiere conciliación.");
    }
    // A duplicate payment notification after a recorded external reversal must
    // never restore the payment, entitlement or seller payable balance.
    if (order.status === "refunded" || order.status === "disputed"
      || existing.status === "refunded" || existing.status === "disputed") {
      return new Response("OK");
    }
    const gatewayFee = marketplaceFlowGatewayFee(amount, payment.paymentData);
    const digest = createHash("sha256").update(`${orderId}:${token}:${amount}:2`).digest("hex");
    const [finalized] = await queryDatabase<{ payment_id: string; outcome: string }>(`
      select payment_id,outcome from public.marketplace_finalize_flow_payment($1,$2,$3,$4,$5,$6,$7)`,
      [orderId, token, amount, buyer, `${payment.flowOrder}:paid`, digest, gatewayFee]);
    if (!finalized) throw new Error("El pago no pasó la validación atómica.");
    if (finalized.outcome === "reversed") return new Response("OK");
    if (finalized.outcome !== "paid") throw new Error("Estado de pago inesperado.");
    await deliverMarketplaceOrder(orderId);
    return new Response("OK");
  } catch (error) {
    console.error("[marketplace/flow/confirm] la confirmación requiere reintento", error);
    return new Response("RETRY", { status: 500 });
  }
}
