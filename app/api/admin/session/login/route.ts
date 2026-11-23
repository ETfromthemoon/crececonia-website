import { NextResponse } from "next/server";
import { adminCookieName, adminCookieOptions, createAdminSession, safeAdminDestination, sameOrigin, validAdminCredential } from "@/lib/admin-session";
import { loginLimited, readLoginBody, recordLoginFailure } from "@/lib/admin-login";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Origen inválido.", { status: 403 });
  if (!process.env.ADMIN_SECRET) return new Response("Administración no configurada.", { status: 503 });
  if (loginLimited()) return new Response("Demasiados intentos. Espera unos minutos.", { status: 429, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
  let body: URLSearchParams;
  try { body = await readLoginBody(request); }
  catch { return new Response("Solicitud inválida.", { status: 400 }); }
  if (!validAdminCredential(body.get("password"))) {
    recordLoginFailure();
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }
  const response = NextResponse.redirect(new URL(safeAdminDestination(body.get("next")), request.url), 303);
  response.cookies.set(adminCookieName(), createAdminSession(), adminCookieOptions());
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
