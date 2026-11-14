import { NextResponse } from "next/server";
import { createOpaqueToken, hashLibraryValue, libraryRateKey, normalizeLibraryEmail, isEbookLibraryEnabled } from "@/lib/ebook-library-config";
import { createChallenge, reserveRequest } from "@/lib/ebook-library-repository";
import { sendLibraryAccess } from "@/lib/ebook-library-email";
import { SITE_URL } from "@/lib/seo";
import { readEbookLibraryJson } from "@/lib/ebook-library-body";

export const dynamic = "force-dynamic";
const generic = () => NextResponse.json({ ok: true, message: "Si podemos procesar la solicitud, recibirás un correo con los siguientes pasos." }, { headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  if (!isEbookLibraryEnabled()) return NextResponse.json({ error: "Biblioteca no disponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(SITE_URL).origin) return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  const parsed = await readEbookLibraryJson(request);
  if (!parsed.ok) return NextResponse.json({ error: "Solicitud no válida." }, { status: parsed.status, headers: { "Cache-Control": "no-store" } });
  const payload = parsed.value;
  const email = normalizeLibraryEmail(payload && typeof payload === "object" ? (payload as Record<string,unknown>).email : null);
  if (!email) return NextResponse.json({ error: "Ingresa un correo válido." }, { status: 400 });
  // Vercel overwrites x-vercel-forwarded-for with the source IP, preventing client spoofing.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return generic();
  try {
    if (!await reserveRequest(await libraryRateKey("email",email), await libraryRateKey("ip",ip))) return generic();
    const token = createOpaqueToken();
    await createChallenge(await hashLibraryValue(token),email);
    const url = new URL("/biblioteca/confirmar", SITE_URL);
    url.hash = new URLSearchParams({token}).toString();
    await sendLibraryAccess(email,url.toString());
  } catch (error) {
    console.error("[ebook-library] solicitud no completada:",error instanceof Error ? error.message : "unknown");
  }
  return generic();
}
