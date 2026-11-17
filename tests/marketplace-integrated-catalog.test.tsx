import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const listPublishedMarketplaceBooks = vi.hoisted(() => vi.fn());
const marketplaceDemoAvailable = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/lib/marketplace-review", () => ({ listPublishedMarketplaceBooks }));
vi.mock("@/lib/marketplace-demo", () => ({ marketplaceDemoAvailable, marketplacePublicAvailable: () => true }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: async () => ({ price: 11900 }) }));

import MarketplaceCatalogPage from "@/app/ebooks/mercado/page";

describe("catálogo integrado del marketplace", () => {
  it("muestra libros propios y de autores con su destino de compra correspondiente", async () => {
    listPublishedMarketplaceBooks.mockResolvedValueOnce([{
      id: "book-1", slug: "libro-autora", title: "Negocios con datos", category: "negocios",
      author_display_name: "Autora invitada", price_minor: "990000", has_cover: false,
    }]);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain('href="/ebook/de-cero-a-claude-en-una-semana"');
    expect(html).toContain('href="/ebooks/mercado/libro-autora"');
    expect(html).toContain("Por CrececonIA");
    expect(html).toContain("Por Autora invitada");
    expect(html).toContain("$11.900");
    expect(html.match(/class="md-card-action"/g)).toHaveLength(8);
    expect(html).toContain('class="md-card-action" href="/ebook/de-cero-a-claude-en-una-semana"');
  });

  it("aplica búsqueda y categoría también a los libros propios", async () => {
    listPublishedMarketplaceBooks.mockResolvedValueOnce([]);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({ q: "agentes", category: "negocios" }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("Agentes de IA para tu Negocio");
    expect(html).not.toContain("De cero a Claude en una semana");
    expect(html).toContain("1 libro en esta página");
  });

  it("incluye los ebooks reales en la vista previa sin dirigir a un checkout de preview", async () => {
    marketplaceDemoAvailable.mockReturnValueOnce(true);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("De cero a Claude en una semana");
    expect(html).toContain('href="https://www.crececonia.cl/ebook/de-cero-a-claude-en-una-semana"');
    expect(html).toContain("Los ebooks de CrececonIA son reales");
  });
});
