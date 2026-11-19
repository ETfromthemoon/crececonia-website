import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import MarketplaceBookPage from "@/app/ebooks/mercado/[slug]/page";

vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/lib/marketplace-review", () => ({
  getPublishedMarketplaceBook: async () => ({
    id: "book-id", title: "Ebook de prueba", category: "ia", price_minor: "11900",
    author_display_name: "Autora", seller_name: "Autora", description: "Descripción", has_cover: false,
  }),
  getMarketplaceRecommendations: async () => [],
}));

afterEach(() => vi.unstubAllEnvs());

const renderBook = async () => renderToStaticMarkup(await MarketplaceBookPage({
  params: Promise.resolve({ slug: "ebook-de-prueba" }),
}));

function configureCheckout(mode: "live" | "sandbox") {
  vi.stubEnv("VERCEL_ENV", mode === "live" ? "production" : "preview");
  vi.stubEnv("FLOW_SANDBOX", mode === "sandbox" ? "true" : "false");
  vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "true");
  vi.stubEnv("MARKETPLACE_LIVE_ENABLED", "true");
  vi.stubEnv("MARKETPLACE_FLOW_SANDBOX_ENABLED", "true");
  vi.stubEnv("MARKETPLACE_SITE_URL", "https://www.crececonia.cl");
  vi.stubEnv("MARKETPLACE_DOWNLOAD_SECRET", "x".repeat(32));
  for (const name of ["FLOW_API_KEY", "FLOW_SECRET_KEY", "DATABASE_URL", "RESEND_API_KEY"]) {
    vi.stubEnv(name, "mock-value");
  }
}

it("muestra la compra real en la ficha cuando el backend está habilitado", async () => {
  configureCheckout("live");
  expect(await renderBook()).toContain("Pagar con Flow");
});

it("conserva la etiqueta de prueba en sandbox", async () => {
  configureCheckout("sandbox");
  expect(await renderBook()).toContain("Continuar a pago de prueba");
});

it("oculta la compra si está desactivada en producción", async () => {
  configureCheckout("live");
  vi.stubEnv("MARKETPLACE_LIVE_ENABLED", "false");
  const html = await renderBook();
  expect(html).toContain("todavía no admite pagos en línea");
  expect(html).not.toContain("Pagar con Flow");
});
