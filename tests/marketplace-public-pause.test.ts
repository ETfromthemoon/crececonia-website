import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { expect, it } from "vitest";
import { config, proxy } from "@/proxy";

const matches = (url: string) => unstable_doesMiddlewareMatch({ config, nextConfig: {}, url });
it.each(["/ebooks/mercado", "/ebooks/mercado/libro", "/ebooks/vender", "/ebooks/vender/condiciones", "/ebooks/vender/simulador"])("lleva %s al catálogo propio", (path) => {
  expect(matches(path)).toBe(true);
  const response = proxy(new NextRequest(new URL(path + "?token=ejemplo", "https://example.org")));
  expect(response.headers.get("location")).toBe("https://example.org/ebooks");
});

it.each(["/api/marketplace/checkout", "/api/marketplace/seller/login", "/api/marketplace/covers/id"])("cierra %s", (path) => {
  expect(matches(path)).toBe(true);
  expect(proxy(new NextRequest(new URL(path, "https://example.org"))).status).toBe(404);
});

it("conserva la confirmación, el retorno y la descarga de compras anteriores", () => {
  expect(matches("/api/marketplace/checkout/download")).toBe(false);
  expect(matches("/api/marketplace/flow/confirm")).toBe(false);
  expect(proxy(new NextRequest("https://example.org/ebooks/mercado/resultado")).headers.get("x-middleware-next")).toBe("1");
});
