import { describe, it, expect } from "vitest";
import {
  EBOOK_CATALOG,
  DEFAULT_EBOOK_RESOURCE,
  getCatalogEntry,
  getActiveCatalogEntries,
} from "@/lib/ebook-catalog";

describe("ebook-catalog", () => {
  it("DEFAULT_EBOOK_RESOURCE apunta al libro 1", () => {
    expect(DEFAULT_EBOOK_RESOURCE).toBe("ebook:de-cero-a-claude-en-una-semana");
  });

  it("getCatalogEntry encuentra una entrada existente", () => {
    const entry = getCatalogEntry(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.resource).toBe(DEFAULT_EBOOK_RESOURCE);
    expect(entry?.active).toBe(true);
  });

  it("getCatalogEntry devuelve undefined para un resource desconocido", () => {
    expect(getCatalogEntry("ebook:no-existe")).toBeUndefined();
  });

  it("getActiveCatalogEntries hoy devuelve solo el libro 1", () => {
    const active = getActiveCatalogEntries();
    expect(active).toHaveLength(1);
    expect(active[0].resource).toBe(DEFAULT_EBOOK_RESOURCE);
  });

  it("el libro activo trae tierPrices, los coming-soon no", () => {
    const active = EBOOK_CATALOG.find((e) => e.active)!;
    expect(active.active && active.tierPrices.regular).toBe(27000);

    const comingSoon = EBOOK_CATALOG.filter((e) => !e.active);
    expect(comingSoon.length).toBeGreaterThan(0);
    comingSoon.forEach((e) => expect("tierPrices" in e).toBe(false));
  });
});
