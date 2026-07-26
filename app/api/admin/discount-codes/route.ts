import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { generateDiscountCodes, type DiscountType } from "@/lib/discount-codes";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const key = request.headers.get("x-admin-key") ?? new URL(request.url).searchParams.get("key");
  return Boolean(process.env.ADMIN_SECRET) && key === process.env.ADMIN_SECRET;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("discount_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type: DiscountType = body?.type;
  const amount: number = Number(body?.amount);
  const quantity: number = Number(body?.quantity ?? 1);
  const expiresAt: string = body?.expiresAt;
  const prefix: string | undefined = body?.prefix || undefined;

  if (type !== "percent" && type !== "fixed") {
    return NextResponse.json({ error: "type debe ser 'percent' o 'fixed'." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0 || (type === "percent" && amount > 100)) {
    return NextResponse.json({ error: "amount inválido." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 200) {
    return NextResponse.json({ error: "quantity debe ser entre 1 y 200." }, { status: 400 });
  }
  if (!expiresAt || Number.isNaN(new Date(expiresAt).getTime())) {
    return NextResponse.json({ error: "expiresAt inválido." }, { status: 400 });
  }
  if (new Date(expiresAt).getTime() <= Date.now()) {
    return NextResponse.json({ error: "expiresAt debe ser una fecha futura." }, { status: 400 });
  }

  try {
    const codes = await generateDiscountCodes({ type, amount, quantity, expiresAt, prefix });
    return NextResponse.json({ codes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error al generar códigos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
