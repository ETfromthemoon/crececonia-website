import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { flowSign, getFlowBase } from "@/lib/flow";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

// Marcadores usados para viajar el tier y el código de descuento dentro de
// commerceOrder (Flow lo devuelve tal cual en payment/getStatus), sin
// depender de una tabla de órdenes pendientes. El tier viaja siempre porque
// el webhook de confirmación no puede reconstruirlo de forma confiable desde
// el monto final una vez que existen descuentos (un código agresivo puede
// hacer que el monto caiga "por casualidad" en el rango de otro tier).
const TIER_MARKER = "_tier_";
const DISCOUNT_MARKER = "_disc_";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: string = body?.email ?? "";
  const discountCode: string | undefined = body?.discountCode || undefined;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const priceInfo = await getCurrentPrice().catch(() => null);
  if (!priceInfo) {
    return NextResponse.json(
      { error: "No se pudo obtener el precio. Intenta nuevamente." },
      { status: 500 }
    );
  }

  let finalAmount = priceInfo.price;
  let appliedCode: string | undefined;

  if (discountCode) {
    const result = await validateDiscountCode(discountCode, priceInfo.price);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    finalAmount = result.finalPrice;
    appliedCode = result.code;
  }

  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;

  const commerceOrder =
    `ebook-${Date.now()}-${randomId()}${TIER_MARKER}${priceInfo.tier}` +
    (appliedCode ? `${DISCOUNT_MARKER}${appliedCode}` : "");

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder,
    subject: "De cero a Claude en una semana",
    currency: "CLP",
    amount: finalAmount,
    email,
    urlConfirmation: `${SITE_URL}/api/flow/confirm`,
    urlReturn: `${SITE_URL}/ebook/de-cero-a-claude-en-una-semana/success`,
  };

  const s = flowSign(params, secretKey);

  const formBody = new URLSearchParams(
    Object.entries({ ...params, s }).map(([k, v]) => [k, String(v)])
  ).toString();

  const flowRes = await fetch(`${getFlowBase()}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });

  if (!flowRes.ok) {
    return NextResponse.json(
      { error: "Error al conectar con el proveedor de pago." },
      { status: 502 }
    );
  }

  const data = await flowRes.json();
  if (!data.url || !data.token) {
    return NextResponse.json(
      { error: "Respuesta inesperada del proveedor de pago." },
      { status: 502 }
    );
  }

  return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}` });
}
