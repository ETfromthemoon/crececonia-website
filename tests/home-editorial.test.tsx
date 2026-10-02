import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EditorialHero from "@/components/EditorialHero";
import FeaturedResources from "@/components/FeaturedResources";
import SkillShowcase from "@/components/SkillShowcase";
import { getPublicGuide, getPublicSkill } from "@/lib/public-catalog";

describe("editorial homepage", () => {
  it("links the visual composition to published resources", () => {
    expect(getPublicGuide("guia-completa-para-usar-claude-code")).toBeTruthy();
    expect(getPublicSkill("captaclientes")).toBeTruthy();
    const hero = renderToStaticMarkup(<EditorialHero />);
    expect(hero).toContain('href="#biblioteca"');
    expect(hero).toContain('href="/ia"');
    expect(renderToStaticMarkup(<FeaturedResources />)).toContain('id="biblioteca"');
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
