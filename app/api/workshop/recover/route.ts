import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { flowSign, getFlowBase } from "@/lib/flow";
import { getSupabaseAdmin } from "@/lib/supabase";
import { hashWorkshopRecoveryToken } from "@/lib/workshop-recovery";
import { WORKSHOP_PATH, WORKSHOP_PRODUCT_KEY, WORKSHOP_TITLE, type WorkshopAvailabilityRow } from "@/lib/workshop-product";

export const dynamic = "force-dynamic";
const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";
const expiredUrl = `${SITE_URL}${WORKSHOP_PATH}?recovery=expired#comprar`;
const randomId = () => randomBytes(5).toString("hex");

type RecoveryRow = { recovery_id: string; email: string; discounted_amount: number; payment_url: string | null };

async function release(commerceOrder: string) {
  await getSupabaseAdmin().rpc("release_class_order", { p_commerce_order: commerceOrder });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return NextResponse.redirect(expiredUrl);
  const db = getSupabaseAdmin();
  const { data: recoveryRows, error: recoveryError } = await db.rpc("begin_workshop_recovery_redemption", {
    p_token_hash: hashWorkshopRecoveryToken(token),
    p_product_key: WORKSHOP_PRODUCT_KEY,
  });
  const recovery = (recoveryRows?.[0] ?? null) as RecoveryRow | null;
  if (recoveryError || !recovery) return NextResponse.redirect(expiredUrl);
  if (recovery.payment_url) return NextResponse.redirect(recovery.payment_url);

  const { data: availabilityRows, error: availabilityError } = await db.rpc("workshop_product_availability", { p_product_key: WORKSHOP_PRODUCT_KEY });
  const offer = ((availabilityRows ?? []) as WorkshopAvailabilityRow[])[0];
  if (availabilityError || !offer) {
    await db.rpc("fail_workshop_recovery_redemption", { p_recovery_id: recovery.recovery_id, p_error: "No hay una oferta disponible" });
    return NextResponse.redirect(expiredUrl);
  }

  const commerceOrder = `workshop-recovery-${Date.now()}-${randomId()}`;
  const { data: orderRows, error: orderError } = await db.rpc("create_class_order", {
    p_product_id: offer.product_id,
    p_offer_id: offer.offer_id,
    p_commerce_order: commerceOrder,
    p_email: recovery.email,
    p_amount_minor: recovery.discounted_amount,
  });
  if (orderError || !orderRows || (Array.isArray(orderRows) && orderRows.length === 0)) {
    await db.rpc("fail_workshop_recovery_redemption", { p_recovery_id: recovery.recovery_id, p_error: "No se pudo reservar el cupo" });
    return NextResponse.redirect(expiredUrl);
  }

  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) {
    await release(commerceOrder);
    await db.rpc("fail_workshop_recovery_redemption", { p_recovery_id: recovery.recovery_id, p_error: "Flow no está configurado" });
    return NextResponse.redirect(expiredUrl);
  }

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder,
    subject: `Workshop: ${WORKSHOP_TITLE} · recuperación 10%`,
    currency: "CLP",
    amount: recovery.discounted_amount,
    email: recovery.email,
    urlConfirmation: `${SITE_URL}/api/workshop/confirm`,
    urlReturn: `${SITE_URL}${WORKSHOP_PATH}?success=1`,
  };

  try {
    const body = new URLSearchParams(Object.entries({ ...params, s: flowSign(params, secretKey) }).map(([key, value]) => [key, String(value)])).toString();
    const response = await fetch(`${getFlowBase()}/payment/create`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const payment = await response.json().catch(() => ({}));
    if (!response.ok || !payment.url || !payment.token) throw new Error("Flow no generó el pago");
    const paymentUrl = `${payment.url}?token=${encodeURIComponent(payment.token)}`;
    const { error: completeError } = await db.rpc("complete_workshop_recovery_redemption", {
      p_recovery_id: recovery.recovery_id,
      p_commerce_order: commerceOrder,
      p_payment_url: paymentUrl,
    });
    if (completeError) throw new Error(completeError.message);
    await db.rpc("record_workshop_attribution", { p_commerce_order: commerceOrder, p_session_id: null, p_source: "email", p_medium: "recovery", p_campaign: "abandoned-checkout-10", p_referrer: null });
    return NextResponse.redirect(paymentUrl);
  } catch (reason) {
    await release(commerceOrder);
    const message = reason instanceof Error ? reason.message : "No se pudo crear el pago";
    await db.rpc("fail_workshop_recovery_redemption", { p_recovery_id: recovery.recovery_id, p_error: message.slice(0, 500) });
    return NextResponse.redirect(expiredUrl);
  }
}
