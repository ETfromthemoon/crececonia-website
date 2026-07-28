import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code: string = body?.code ?? "";

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Ingresa un código." }, { status: 400 });
  }

  // Los códigos de descuento solo aplican a la compra de 1 solo libro (el
  // combo y el código nunca se combinan), así que siempre se valida contra
  // el precio del libro por defecto.
  const priceInfo = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE).catch(() => null);
  if (!priceInfo) {
    return NextResponse.json(
      { valid: false, reason: "No se pudo verificar el código. Intenta nuevamente." },
      { status: 500 }
    );
  }

  const result = await validateDiscountCode(code, priceInfo.price);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
