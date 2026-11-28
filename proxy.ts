import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/ebooks/")) {
    if (path === "/ebooks/mercado/resultado") return NextResponse.next();
    return NextResponse.redirect(new URL("/ebooks", request.url));
  }
  if (path.startsWith("/api/marketplace/")) {
    return new NextResponse(null, { status: 404 });
  }
  // Old bookmarked keys are discarded before rendering any React or analytics.
  // Login always requires a same-origin POST; a cross-site GET cannot log in.
  const legacy = request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.searchParams.has("key");
  const response = legacy
    ? NextResponse.redirect(new URL("/admin/login", request.url), 303)
    : NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  // Native same-origin form POSTs need a non-null Origin for the CSRF guard.
  // Still suppress referrers to external sites and from legacy credential URLs.
  response.headers.set("Referrer-Policy", legacy ? "no-referrer" : "same-origin");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; frame-src 'none'; form-action 'self'; base-uri 'self'; frame-ancestors 'self'");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/ebooks/mercado/:path*", "/ebooks/vender/:path*", "/api/marketplace/checkout", "/api/marketplace/covers/:path*", "/api/marketplace/seller/:path*"] };
