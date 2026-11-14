import { NextResponse } from "next/server";
import { sellerCookieName, sellerCookieOptions } from "@/lib/marketplace-seller-auth";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return new Response("Origen inválido", { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sellerCookieName(), "", { ...sellerCookieOptions(), maxAge: 0 });
  return response;
}
