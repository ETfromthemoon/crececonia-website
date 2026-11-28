import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import EditorialHero from "@/components/EditorialHero";
import FeaturedResources from "@/components/FeaturedResources";
import SkillShowcase from "@/components/SkillShowcase";
import { getPublicGuide, getPublicSkill } from "@/lib/public-catalog";

describe("editorial homepage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("links the visual composition to published resources", () => {
    vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "true");
    expect(getPublicGuide("guia-completa-para-usar-claude-code")).toBeTruthy();
    expect(getPublicSkill("captaclientes")).toBeTruthy();
    const hero = renderToStaticMarkup(<EditorialHero />);
    expect(hero).toContain('href="#biblioteca"');
    expect(hero).toContain('href="/ia"');
    const library = renderToStaticMarkup(<FeaturedResources />);
    expect(library).toContain('id="biblioteca"');
    expect(library).not.toContain('/ebooks/mercado');
  });
  it("keeps CrececonIA ebooks available during the marketplace pause", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MARKETPLACE_PUBLIC_ENABLED", "false");
    const library = renderToStaticMarkup(<FeaturedResources />);
    expect(library).toContain('href="/ebooks"');
    expect(library).not.toContain("/ebooks/mercado");
    expect(library).not.toContain("Invitar a vender");
  });
  it("labels the simulation and exposes three real selection buttons", () => {
    const html = renderToStaticMarkup(<SkillShowcase />);
    expect(html).toContain("Ejemplo ilustrativo");
    expect(html).toContain("No ejecuta búsquedas ni utiliza datos de clientes");
    expect(html.match(/type="button"/g)).toHaveLength(3);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-live="polite"');
  });
});
