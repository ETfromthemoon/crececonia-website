import { NextResponse } from "next/server";
import { adminCookieName, adminCookieOptions, sameOrigin } from "@/lib/admin-session";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Origen inválido.", { status: 403 });
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set(adminCookieName(), "", { ...adminCookieOptions(), maxAge: 0 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
