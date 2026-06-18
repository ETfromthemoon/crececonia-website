import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { flowSign, getFlowBase } from "@/lib/flow";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: string = body?.email ?? "";

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

  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder: `ebook-${Date.now()}-${randomId()}`,
    subject: "De cero a Claude en una semana",
    currency: "CLP",
    amount: priceInfo.price,
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
