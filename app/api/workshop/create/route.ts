import { NextResponse } from "next/server";
import { flowSign, getFlowBase } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabase";
import { validateDiscountCode } from "@/lib/discount-codes";
import { WORKSHOP_PATH, WORKSHOP_PRODUCT_KEY, WORKSHOP_TITLE, type WorkshopAvailabilityRow } from "@/lib/workshop-product";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";
const validEmail = (value: unknown): value is string => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const randomId = () => Math.random().toString(36).slice(2, 8);

async function release(commerceOrder: string) { await getSupabaseAdmin().rpc("release_class_order", { p_commerce_order: commerceOrder }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const offerKey = typeof body?.offerKey === "string" ? body.offerKey : "";
  const rawDiscountCode = typeof body?.discountCode === "string" ? body.discountCode.trim() : "";
  if (!validEmail(email)) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("workshop_product_availability", { p_product_key: WORKSHOP_PRODUCT_KEY });
  const offer = ((data ?? []) as WorkshopAvailabilityRow[]).find((item) => item.offer_key === offerKey);
  if (error || !offer || offer.sold_cupos + offer.reserved_cupos >= offer.total_cupos) return NextResponse.json({ error: "Las entradas ya no están disponibles." }, { status: 409 });

  const discount = rawDiscountCode ? await validateDiscountCode(rawDiscountCode, offer.amount_minor) : null;
  if (discount && !discount.valid) return NextResponse.json({ error: discount.reason }, { status: 400 });
  const amount = discount?.valid ? discount.finalPrice : offer.amount_minor;
  // El código queda ligado a la orden y se consume sólo tras la confirmación
  // real de Flow. Su formato restringido evita ambigüedad con el ID de orden.
  const commerceOrder = `workshop-${Date.now()}-${randomId()}${discount?.valid ? `-promo-${discount.code}` : ""}`;
  const { data: orderRows, error: orderError } = await db.rpc("create_class_order", { p_product_id: offer.product_id, p_offer_id: offer.offer_id, p_commerce_order: commerceOrder, p_email: email, p_amount_minor: amount });
  if (orderError || !orderRows || (Array.isArray(orderRows) && orderRows.length === 0)) return NextResponse.json({ error: "No pudimos reservar tu entrada." }, { status: 503 });
  await db.rpc("record_workshop_attribution", { p_commerce_order: commerceOrder, p_session_id: typeof body?.sessionId === "string" ? body.sessionId : null, p_source: typeof body?.source === "string" ? body.source : null, p_medium: typeof body?.medium === "string" ? body.medium : null, p_campaign: typeof body?.campaign === "string" ? body.campaign : null, p_referrer: typeof body?.referrer === "string" ? body.referrer : null });

  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) { await release(commerceOrder); return NextResponse.json({ error: "El pago no está disponible en este momento." }, { status: 503 }); }
  const params: Record<string, string | number> = { apiKey, commerceOrder, subject: `Workshop: ${WORKSHOP_TITLE}`, currency: "CLP", amount, email, urlConfirmation: `${SITE_URL}/api/workshop/confirm`, urlReturn: `${SITE_URL}${WORKSHOP_PATH}?success=1` };
  const bodyEncoded = new URLSearchParams(Object.entries({ ...params, s: flowSign(params, secretKey) }).map(([key, value]) => [key, String(value)])).toString();
  try {
    const response = await fetch(`${getFlowBase()}/payment/create`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: bodyEncoded });
    const payment = await response.json().catch(() => ({}));
    if (!response.ok || !payment.url || !payment.token) { await release(commerceOrder); return NextResponse.json({ error: "No pudimos conectar con Flow." }, { status: 502 }); }
    return NextResponse.json({ redirectUrl: `${payment.url}?token=${encodeURIComponent(payment.token)}`, amount });
  } catch {
    await release(commerceOrder);
    return NextResponse.json({ error: "No pudimos conectar con Flow." }, { status: 502 });
  }
}
