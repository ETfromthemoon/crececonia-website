import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { flowSign, getFlowBase } from "@/lib/flow";
import { getCatalogEntry, DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: string = body?.email ?? "";
  const discountCode: string | undefined = body?.discountCode || undefined;
  const resources: string[] =
    Array.isArray(body?.resources) && body.resources.length > 0
      ? body.resources
      : [DEFAULT_EBOOK_RESOURCE];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  const uniqueResources = new Set(resources);
  if (uniqueResources.size !== resources.length) {
    return NextResponse.json(
      { error: "No se puede repetir el mismo libro en el combo." },
      { status: 400 }
    );
  }

  for (const resource of resources) {
    const entry = getCatalogEntry(resource);
    if (!entry || !entry.active) {
      return NextResponse.json({ error: `Recurso no disponible: ${resource}` }, { status: 400 });
    }
  }

  if (resources.length > 1 && discountCode) {
    return NextResponse.json(
      { error: "Los códigos de descuento no aplican en combos." },
      { status: 400 }
    );
  }

  const priceInfos = await Promise.all(resources.map((r) => getCurrentPrice(r))).catch(() => null);
  if (!priceInfos) {
    return NextResponse.json(
      { error: "No se pudo obtener el precio. Intenta nuevamente." },
      { status: 500 }
    );
  }

  const bundle = computeBundleTotal(
    resources.map((resource, i) => ({ resource, price: priceInfos[i].price }))
  );

  let finalAmount = bundle.total;
  let appliedCode: string | undefined;

  if (discountCode) {
    // Solo llega acá si resources.length === 1 (ver validación arriba).
    const result = await validateDiscountCode(discountCode, priceInfos[0].price);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    finalAmount = result.finalPrice;
    appliedCode = result.code;
  }

  const apiKey = process.env.FLOW_API_KEY!;
  const secretKey = process.env.FLOW_SECRET_KEY!;

  // commerceOrder queda exactamente en el formato corto original — nunca
  // metemos datos de longitud variable (tiers, código de descuento, lista de
  // libros) ahí dentro. Flow no documenta un máximo de caracteres para este
  // campo. El detalle del combo vive en ebook_pending_orders, indexado por
  // este mismo commerceOrder, y el webhook de confirmación lo lee de ahí.
  const commerceOrder = `ebook-${Date.now()}-${randomId()}`;

  const pendingResources = resources.map((resource, i) => ({
    resource,
    tier: priceInfos[i].tier,
    amount: discountCode ? finalAmount : bundle.items[i].amount,
  }));

  // Guardar el detalle es contabilidad, no un requisito para cobrar: si
  // Supabase falla acá NO abortamos la venta. El webhook de confirmación tiene
  // fallback (reconstruye el tier desde el monto, para 1 solo libro) para
  // cuando no encuentra la fila.
  try {
    const { error: pendingError } = await getSupabaseAdmin()
      .from("ebook_pending_orders")
      .insert({
        commerce_order: commerceOrder,
        resources: pendingResources,
        discount_code: appliedCode ?? null,
      });
    if (pendingError) throw new Error(pendingError.message);
  } catch (err) {
    console.error(
      `[flow/create] no se registró la orden pendiente ${commerceOrder} (resources=${resources.join(",")}):`,
      err
    );
  }

  const catalogEntries = resources.map((r) => getCatalogEntry(r)!);
  const subject =
    catalogEntries.length === 1
      ? catalogEntries[0].title
      : `Combo CrececonIA: ${catalogEntries.map((e) => e.title).join(" + ")}`;

  const params: Record<string, string | number> = {
    apiKey,
    commerceOrder,
    subject,
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
