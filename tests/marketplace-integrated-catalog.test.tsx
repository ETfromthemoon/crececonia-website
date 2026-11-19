import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const listPublishedMarketplaceBooks = vi.hoisted(() => vi.fn());
const listPublishedMarketplaceCategories = vi.hoisted(() => vi.fn(async () => [] as string[]));
const marketplaceDemoAvailable = vi.hoisted(() => vi.fn(() => false));
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/lib/marketplace-review", () => ({ listPublishedMarketplaceBooks, listPublishedMarketplaceCategories }));
vi.mock("@/lib/ebook-catalog", async (importOriginal) => {
  const catalog = await importOriginal<typeof import("@/lib/ebook-catalog")>();
  return { ...catalog, getLiveCatalogEntries: vi.fn(catalog.getLiveCatalogEntries) };
});
vi.mock("@/lib/marketplace-demo", () => ({ marketplaceDemoAvailable, marketplacePublicAvailable: () => true }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: async () => ({ price: 11900 }) }));

import MarketplaceCatalogPage from "@/app/ebooks/mercado/page";
import { getLiveCatalogEntries } from "@/lib/ebook-catalog";

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

  it("solo incluye ebooks reales en la vista previa y enlaza a las fichas públicas", async () => {
    marketplaceDemoAvailable.mockReturnValueOnce(true);
    listPublishedMarketplaceBooks.mockResolvedValueOnce([]);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("De cero a Claude en una semana");
    expect(html).toContain('href="https://www.crececonia.cl/ebook/de-cero-a-claude-en-una-semana"');
    expect(html).not.toContain("/ebooks/mercado/demo-");
    expect(html.match(/class="md-card-action"/g)).toHaveLength(7);
  });

  it("muestra las categorías publicadas aunque no estén en los resultados de la página actual", async () => {
    const ownBook = getLiveCatalogEntries().find((entry) => entry.resource === "ebook:de-cero-a-claude-en-una-semana")!;
    vi.mocked(getLiveCatalogEntries).mockReturnValueOnce([ownBook]);
    listPublishedMarketplaceCategories.mockResolvedValueOnce(["negocios"]);
    listPublishedMarketplaceBooks.mockResolvedValueOnce([]);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({ page: "2", q: "sin resultados" }) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain('href="/ebooks/mercado?q=sin+resultados&amp;category=ia"');
    expect(html).toContain('href="/ebooks/mercado?q=sin+resultados&amp;category=negocios"');
    expect(html).not.toContain('category=tecnologia');
  });

  it("muestra y filtra libros de vida y bienestar cuando están publicados", async () => {
    listPublishedMarketplaceCategories.mockResolvedValueOnce(["bienestar"]);
    listPublishedMarketplaceBooks.mockResolvedValueOnce([{
      id: "luna-book", slug: "femenina-a-tu-manera", title: "Femenina a tu manera",
      category: "bienestar", author_display_name: "Luna Maren · personaje digital",
      price_minor: "26900", has_cover: false,
    }]);
    const page = await MarketplaceCatalogPage({ searchParams: Promise.resolve({ category: "bienestar" }) });
    const html = renderToStaticMarkup(page);
    expect(listPublishedMarketplaceBooks).toHaveBeenCalledWith(1, { query: "", category: "bienestar" });
    expect(html).toContain("Vida y bienestar");
    expect(html).toContain('href="/ebooks/mercado/femenina-a-tu-manera"');
    expect(html).not.toContain("De cero a Claude en una semana");
  });
});
