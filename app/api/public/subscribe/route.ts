import { NextResponse } from "next/server";
import { clean, isValidEmail, PUBLIC_LEAD_LIMITS, saveSubscriber } from "@/lib/public-leads";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = clean(body?.email, PUBLIC_LEAD_LIMITS.email).toLowerCase();
  const source = clean(body?.source, PUBLIC_LEAD_LIMITS.short);
  const resource = clean(body?.resource, PUBLIC_LEAD_LIMITS.resource);
  if (!isValidEmail(email)) return NextResponse.json({ detail: "Email inválido." }, { status: 400 });
  try {
    await saveSubscriber(email, source, resource);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[public/subscribe] error:", error);
    return NextResponse.json({ detail: "No pudimos registrar tu correo." }, { status: 500 });
  }
}
