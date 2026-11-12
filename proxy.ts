import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Old bookmarked keys are discarded before rendering any React or analytics.
  // Login always requires a same-origin POST; a cross-site GET cannot log in.
  const legacy = request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.searchParams.has("key");
  const response = legacy
    ? NextResponse.redirect(new URL("/admin/login", request.url), 303)
    : NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-src 'none'; form-action 'self'; base-uri 'self'; frame-ancestors 'self'");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
