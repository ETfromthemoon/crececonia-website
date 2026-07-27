import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { flowSign, getFlowBase } from "@/lib/flow";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

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

  // commerceOrder queda exactamente en el formato corto original — nunca
  // metemos datos de longitud variable (tier, código de descuento) ahí
  // dentro. Flow no documenta un máximo de caracteres para este campo, así
  // que no apostamos a que un código con prefijo largo no lo rompa. El tier
  // y el código elegido viven en ebook_pending_orders, indexados por este
  // mismo commerceOrder, y el webhook de confirmación los lee de ahí.
  const commerceOrder = `ebook-${Date.now()}-${randomId()}`;

  // Guardar el tier/código es contabilidad, no un requisito para cobrar: si
  // Supabase falla acá NO abortamos la venta. El webhook de confirmación tiene
  // fallback (reconstruye el tier desde el monto) para cuando no encuentra la
  // fila. Perder el registro del código es peor que perder la venta, pero
  // bloquear el checkout es peor que ambos.
  try {
    const { error: pendingError } = await getSupabaseAdmin()
      .from("ebook_pending_orders")
      .insert({
        commerce_order: commerceOrder,
        tier: priceInfo.tier,
        discount_code: appliedCode ?? null,
      });
    if (pendingError) throw new Error(pendingError.message);
  } catch (err) {
    console.error(
      `[flow/create] no se registró la orden pendiente ${commerceOrder} (tier=${priceInfo.tier}, código=${appliedCode ?? "ninguno"}):`,
      err
    );
  }

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
