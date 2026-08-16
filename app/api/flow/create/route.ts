import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { flowSign, getFlowBase } from "@/lib/flow";
import {
  getCatalogEntry,
  isCatalogEntryLive,
  isAdminPreviewKey,
  DEFAULT_EBOOK_RESOURCE,
  EBOOK_CATALOG,
} from "@/lib/ebook-catalog";
import { computeBundleTotal } from "@/lib/ebook-bundles";
import { getOfferIdForResources } from "@/lib/ebook-offers";
import { captureServerEvent } from "@/lib/posthog-server";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function discardPendingOrder(db: ReturnType<typeof getSupabaseAdmin>, commerceOrder: string) {
  try {
    const { error } = await db.from("ebook_pending_orders").delete().eq("commerce_order", commerceOrder);
    if (error) console.error(`[flow/create] no se pudo limpiar ${commerceOrder}:`, error.message);
  } catch (err) {
    console.error(`[flow/create] no se pudo limpiar ${commerceOrder}:`, err);
  }
}

async function captureCheckoutFailure(
  distinctId: string | undefined,
  reason: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  try {
    await captureServerEvent("ebook_checkout_failed", distinctId ?? "anonymous", {
      reason,
      ...properties,
    });
  } catch (err) {
    console.error("[flow/create] falló el evento de checkout fallido:", err);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email: string = body?.email ?? "";
  const discountCode: string | undefined = body?.discountCode || undefined;
  const previewKey: string | undefined = body?.previewKey || undefined;
  const analyticsDistinctId =
    typeof body?.analyticsDistinctId === "string" && body.analyticsDistinctId.length <= 200
      ? body.analyticsDistinctId
      : undefined;
  const pricingVariant =
    typeof body?.pricingVariant === "string" && body.pricingVariant.length <= 80
      ? body.pricingVariant
      : undefined;
  const resources: string[] =
    Array.isArray(body?.resources) && body.resources.length > 0
      ? body.resources
      : [DEFAULT_EBOOK_RESOURCE];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  // Endpoint público: acotar el array antes de iterarlo. Nunca puede ser
  // válido pedir más recursos que entradas tiene el catálogo entero.
  if (resources.length > EBOOK_CATALOG.length || !resources.every((r) => typeof r === "string")) {
    return NextResponse.json({ error: "Lista de libros inválida." }, { status: 400 });
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
    // Defensa en profundidad: la página ya oculta el libro antes de su
    // `visibleFrom`, pero esto evita que alguien compre pegándole directo a
    // esta API antes del instante de lanzamiento acordado.
    // `isAdminPreviewKey` es la única excepción: el dueño del sitio probando
    // el checkout de un libro antes de esa hora, con un secreto que solo él
    // conoce — nunca deja pasar a nadie más.
    if (!isCatalogEntryLive(entry) && !isAdminPreviewKey(previewKey)) {
      return NextResponse.json({ error: `Recurso no disponible: ${resource}` }, { status: 400 });
    }
  }

  if (resources.length > 1 && discountCode) {
    return NextResponse.json(
      { error: "Los códigos de descuento no aplican en combos." },
      { status: 400 }
    );
  }

  const priceInfos = await Promise.all(resources.map((r) => getCurrentPrice(r))).catch(async () => {
    await captureCheckoutFailure(analyticsDistinctId, "price_lookup_failed", {
      item_count: resources.length,
    });
    return null;
  });
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
    analytics_distinct_id: analyticsDistinctId,
    pricing_variant: pricingVariant,
  }));

  // El manifiesto es la fuente de verdad de entrega del combo. Si no puede
  // persistirse, no se puede iniciar un cobro que luego no sabríamos entregar.
  const db = getSupabaseAdmin();
  const { error: pendingError } = await db
    .from("ebook_pending_orders")
    .insert({
      commerce_order: commerceOrder,
      resources: pendingResources,
      discount_code: appliedCode ?? null,
    });
  if (pendingError) {
    console.error(`[flow/create] no se registró la orden pendiente ${commerceOrder}:`, pendingError.message);
    await captureCheckoutFailure(analyticsDistinctId, "pending_order_failed", {
      item_count: resources.length,
    });
    return NextResponse.json(
      { error: "No pudimos preparar tu orden. Intenta nuevamente." },
      { status: 503 }
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
    await discardPendingOrder(db, commerceOrder);
    await captureCheckoutFailure(analyticsDistinctId, "provider_http_error", {
      item_count: resources.length,
      provider_status: flowRes.status,
    });
    return NextResponse.json(
      { error: "Error al conectar con el proveedor de pago." },
      { status: 502 }
    );
  }

  const data = await flowRes.json();
  if (!data.url || !data.token) {
    await discardPendingOrder(db, commerceOrder);
    await captureCheckoutFailure(analyticsDistinctId, "provider_invalid_response", {
      item_count: resources.length,
    });
    return NextResponse.json(
      { error: "Respuesta inesperada del proveedor de pago." },
      { status: 502 }
    );
  }

  const offerId = getOfferIdForResources(resources);
  try {
    await captureServerEvent("ebook_checkout_created", analyticsDistinctId ?? email, {
      resource: resources[0],
      tier: priceInfos[0].tier,
      item_count: resources.length,
      has_discount_code: Boolean(discountCode),
      resources,
      offer_id: offerId,
      amount: finalAmount,
      order_id: commerceOrder,
      pricing_variant: pricingVariant,
    });
  } catch (err) {
    console.error("[flow/create] falló el evento de PostHog:", err);
  }

  return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}`, orderId: commerceOrder });
}
