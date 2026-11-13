import { NextResponse } from "next/server";
import { consumeSellerLogin, createSellerSession, sellerCookieName, sellerCookieOptions } from "@/lib/marketplace-seller-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Origen inválido", { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return new Response("Solicitud inválida", { status: 400 }); }
  const token = (body as { token?: unknown } | null)?.token;
  if (typeof token !== "string") return new Response("Enlace inválido", { status: 400 });
  try {
    const identityId = await consumeSellerLogin(token);
    if (!identityId) return new Response("Enlace vencido o ya utilizado", { status: 400 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sellerCookieName(), createSellerSession(identityId), sellerCookieOptions());
    return response;
  } catch (error) {
    console.error("marketplace_seller_verify_error", error instanceof Error ? error.message : "unknown");
    return new Response("Servicio temporalmente no disponible", { status: 503 });
  }
}
