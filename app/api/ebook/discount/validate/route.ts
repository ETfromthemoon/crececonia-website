import { NextResponse } from "next/server";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { validateDiscountCode } from "@/lib/discount-codes";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code: string = body?.code ?? "";

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Ingresa un código." }, { status: 400 });
  }

  const priceInfo = await getCurrentPrice().catch(() => null);
  if (!priceInfo) {
    return NextResponse.json(
      { valid: false, reason: "No se pudo verificar el código. Intenta nuevamente." },
      { status: 500 }
    );
  }

  const result = await validateDiscountCode(code, priceInfo.price);
  return NextResponse.json(result, { status: result.valid ? 200 : 400 });
}
