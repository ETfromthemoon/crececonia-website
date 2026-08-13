import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EBOOK_PRODUCT_THEATER_CONTENT } from "@/lib/ebook-product-theater";

const SALE_RESOURCES = [
  "ebook:de-cero-a-claude-en-una-semana",
  "ebook:claude-nivel-experto",
  "ebook:agentes-de-ia",
  "ebook:creacion-de-webs-con-ia",
] as const;

describe("experiencia visual de producto de los ebooks", () => {
  it.each(SALE_RESOURCES)("tiene contenido completo y muestras reales para %s", (resource) => {
    const content = EBOOK_PRODUCT_THEATER_CONTENT[resource];

    expect(content).toBeDefined();
    expect(content.stats).toHaveLength(4);
    expect(content.previews).toHaveLength(4);
    expect(content.journey.steps).toHaveLength(3);

    for (const preview of content.previews) {
      expect(preview.src).toMatch(/^\/ebooks\/previews\/.+\.webp$/);
      expect(existsSync(join(process.cwd(), "public", preview.src))).toBe(true);
      expect(preview.width).toBeGreaterThan(0);
      expect(preview.height).toBeGreaterThan(0);
    }
  });
});
