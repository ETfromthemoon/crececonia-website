import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import {
  DEFAULT_EBOOK_RESOURCE,
  getCatalogEntry,
  isCatalogEntryLive,
  isAdminPreviewKey,
} from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code: string = body?.code ?? "";
  // `resource` es opcional por compatibilidad con clientes viejos que no lo
  // mandan — cae al libro 1, que es el único que existía cuando este
  // endpoint se escribió. Antes de este fix, el endpoint ignoraba por
  // completo el resource real de la página y siempre validaba contra el
  // libro 1: en cualquier otra página, el "precio con descuento" mostrado
  // antes de pagar podía ser mayor que el precio tachado. El monto
  // efectivamente cobrado siempre fue correcto (Flow revalida contra el
  // resource real en /api/flow/create), pero el número mostrado no.
  const resource: string = body?.resource || DEFAULT_EBOOK_RESOURCE;
  const previewKey: string | undefined = body?.previewKey || undefined;

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Ingresa un código." }, { status: 400 });
  }

  const entry = getCatalogEntry(resource);
  if (!entry || !entry.active || (!isCatalogEntryLive(entry) && !isAdminPreviewKey(previewKey))) {
    return NextResponse.json({ valid: false, reason: "Código no válido." }, { status: 400 });
  }

  // Los códigos de descuento solo aplican a la compra de 1 solo libro (el
  // combo y el código nunca se combinan) — /api/flow/create ya lo exige.
  const priceInfo = await getCurrentPrice(resource).catch(() => null);
  if (!priceInfo) {
    return NextResponse.json(
      { valid: false, reason: "No se pudo verificar el código. Intenta nuevamente." },
      { status: 500 }
    );
  }

  const result = await validateDiscountCode(code, priceInfo.price);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
