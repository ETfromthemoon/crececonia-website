import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResourceNav from "@/components/ResourceNav";
import Navbar from "@/components/Navbar";
import HubCard from "@/components/HubCard";
import EbookPricing from "@/components/EbookPricing";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("posthog-js/react", () => ({ useFeatureFlagVariantKey: () => "control" }));

describe("public resource interface", () => {
  beforeEach(() => { route.pathname = "/"; });

  it.each([
    ["/ebook/de-cero-a-claude-en-una-semana", "Ebooks"],
    ["/guias/guia-completa-para-usar-claude-code", "Guías"],
    ["/skills/captaclientes", "Skills"],
    ["/centro", "Explorar"],
  ])("keeps the correct resource selected at %s", (pathname, label) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(<ResourceNav />);
    expect(html).toMatch(new RegExp(`aria-current="page"[^>]*>${label}</a>`));
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(renderToStaticMarkup(<Navbar />)).toContain('href="/centro" aria-current="page">Recursos');
  });

  it("keeps external resource links safe and explicit", () => {
    const html = renderToStaticMarkup(<HubCard item={{
      tipo: "enlace", slug: "external", titulo: "Recurso externo", descripcion: "Referencia",
      href: "https://example.com", externo: true, categoria: "desarrollo", temas: [], tags: [],
    }} />);
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html).toContain("Abrir enlace");
  });

  it("does not advertise a provisional checkout price before loading", () => {
    const html = renderToStaticMarkup(<EbookPricing />);
    expect(html).toContain("Consultando precio vigente");
    expect(html).not.toContain("27.000");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain("Esperando precio vigente");
  });
});
