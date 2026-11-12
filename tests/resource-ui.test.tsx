import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResourceNav from "@/components/ResourceNav";
import Navbar from "@/components/Navbar";
import HubCard from "@/components/HubCard";
import EbookPricing from "@/components/EbookPricing";
import EbookCard from "@/components/EbookCard";
import EbookFlashBanner from "@/components/EbookFlashBanner";

const route = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("posthog-js/react", () => ({ useFeatureFlagVariantKey: () => "control" }));

describe("public resource interface", () => {
  it.each(["book", "route"] as const)("muestra el antes tachado, el precio de hoy y el 50%% en %s", (variant) => {
    const html = renderToStaticMarkup(<EbookCard title="Ebook" description="Descripción" href="/ebooks" coverSrc="/ebooks/de-cero-a-claude-en-una-semana.jpg" status="available" variant={variant} previousPriceLabel="$17.900 CLP" priceLabel="$8.950 CLP" />);
    expect(html).toContain("<s>$17.900 CLP</s>");
    expect(html).toContain("Hoy $8.950 CLP");
    expect(html).toContain("50% de descuento · Solo por hoy");
  });

  it("retira el anuncio cuando la promoción termina", () => {
    expect(renderToStaticMarkup(<EbookFlashBanner active={false} />)).toBe("");
    expect(renderToStaticMarkup(<EbookFlashBanner active />)).toContain("Hasta las 23:59, hora de Santiago");
  });
  beforeEach(() => { route.pathname = "/"; });

  it.each([
    ["/ebook/de-cero-a-claude-en-una-semana", "Ebooks"],
    ["/guias/guia-completa-para-usar-claude-code", "Guías"],
    ["/skills/captaclientes", "Skills"],
    ["/centro", "Explorar"],
    ["/centro/repositorios", "Repositorios"],
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

  it("labels a repository as a repository and opens its source safely", () => {
    const html = renderToStaticMarkup(<HubCard item={{
      tipo: "repositorio", slug: "proyecto", titulo: "Proyecto", descripcion: "Herramienta pública",
      href: "https://github.com/ETfromthemoon/proyecto", externo: true,
      categoria: "desarrollo", temas: [], tags: [], meta: "GitHub",
    }} />);
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html).toContain("Repositorio");
    expect(html).toContain("Ver repositorio");
    expect(html).not.toContain("↓ GitHub");
  });

  it("does not advertise a provisional checkout price before loading", () => {
    const html = renderToStaticMarkup(<EbookPricing />);
    expect(html).toContain("Consultando precio vigente");
    expect(html).not.toContain("27.000");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
    expect(html).toContain("Esperando precio vigente");
  });
});
