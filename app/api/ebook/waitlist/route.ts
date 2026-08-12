import { NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/ebook-waitlist";
import { getCatalogEntry } from "@/lib/ebook-catalog";

export const dynamic = "force-dynamic";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Endpoint público sin autenticación: se acotan largos para que un POST con
// strings enormes no infle la fila en Supabase ni el envío a Resend.
const MAX_EMAIL_LENGTH = 254; // límite práctico de RFC 5321
const MAX_RESOURCE_LENGTH = 100;
const MAX_SOURCE_LENGTH = 200;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const resource = typeof body?.resource === "string" ? body.resource.trim() : "";
  const source = typeof body?.source === "string" ? body.source.trim().slice(0, MAX_SOURCE_LENGTH) || undefined : undefined;

  if (!isValidEmail(email) || email.length > MAX_EMAIL_LENGTH) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (!resource || resource.length > MAX_RESOURCE_LENGTH) {
    return NextResponse.json({ error: "Falta el recurso." }, { status: 400 });
  }

  const entry = getCatalogEntry(resource);
  if (!entry || !entry.active) {
    return NextResponse.json({ error: "Recurso no disponible." }, { status: 400 });
  }

  try {
    await addToWaitlist({ email, resource, source });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ebook/waitlist] error:", err);
    return NextResponse.json({ error: "No se pudo registrar tu email." }, { status: 500 });
  }
}
