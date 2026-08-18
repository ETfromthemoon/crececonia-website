import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CLASS_PATH, CLASS_TITLE, type ClassAvailabilityRow } from "@/lib/class-product";
import { flowSign, getFlowBase } from "@/lib/flow";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function releaseOrder(commerceOrder: string) {
  await getSupabaseAdmin().rpc("release_class_order", { p_commerce_order: commerceOrder });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const offerKey = typeof body?.offerKey === "string" ? body.offerKey : "";
  if (!isValidEmail(email)) return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  if (!/^[a-z0-9-]{3,80}$/.test(offerKey)) return NextResponse.json({ error: "Tramo de precio inválido." }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data: availabilityRows, error: availabilityError } = await db.rpc("class_product_availability");
  const availability = (availabilityRows ?? []) as ClassAvailabilityRow[];
  const offer = availability.find((candidate) => candidate.offer_key === offerKey);
  if (availabilityError || !offer) return NextResponse.json({ error: "Ese tramo ya no está disponible." }, { status: 409 });
  if (offer.sold_cupos + offer.reserved_cupos >= offer.total_cupos) {
    return NextResponse.json({ error: "Ese tramo se agotó. Elige otro cupo." }, { status: 409 });
  }

  const commerceOrder = `class-${Date.now()}-${randomId()}`;
  const { data: orderRows, error: orderError } = await db.rpc("create_class_order", {
    p_product_id: offer.product_id,
    p_offer_id: offer.offer_id,
    p_commerce_order: commerceOrder,
    p_email: email,
    p_amount_minor: offer.amount_minor,
  });
  if (orderError || !orderRows || (Array.isArray(orderRows) && orderRows.length === 0)) {
    const soldOut = orderError?.message?.includes("offer_sold_out");
    return NextResponse.json({ error: soldOut ? "Ese tramo se agotó. Elige otro cupo." : "No pudimos reservar tu cupo. Intenta nuevamente." }, { status: soldOut ? 409 : 503 });
  }

  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) {
    await releaseOrder(commerceOrder);
    return NextResponse.json({ error: "El pago no está disponible en este momento." }, { status: 503 });
  }

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder,
    subject: `Clase: ${CLASS_TITLE}`,
    currency: "CLP",
    amount: offer.amount_minor,
    email,
    urlConfirmation: `${SITE_URL}/api/clase/confirm`,
    urlReturn: `${SITE_URL}${CLASS_PATH}?success=1`,
  };
  const signature = flowSign(params, secretKey);
  const formBody = new URLSearchParams(
    Object.entries({ ...params, s: signature }).map(([key, value]) => [key, String(value)])
  ).toString();

  let flowResponse: Response;
  try {
    flowResponse = await fetch(`${getFlowBase()}/payment/create`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody,
    });
  } catch {
    await releaseOrder(commerceOrder);
    return NextResponse.json({ error: "No pudimos conectar con el proveedor de pago." }, { status: 502 });
  }

  if (!flowResponse.ok) {
    await releaseOrder(commerceOrder);
    return NextResponse.json({ error: "Error al conectar con el proveedor de pago." }, { status: 502 });
  }
  const flowData = await flowResponse.json().catch(() => ({}));
  if (!flowData.url || !flowData.token) {
    await releaseOrder(commerceOrder);
    return NextResponse.json({ error: "Respuesta inesperada del proveedor de pago." }, { status: 502 });
  }

  return NextResponse.json({ redirectUrl: `${flowData.url}?token=${encodeURIComponent(flowData.token)}`, orderId: commerceOrder });
}
