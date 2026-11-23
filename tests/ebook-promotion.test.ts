import { describe, it, expect } from "vitest";
import { computeEbookTotal, EBOOK_FLASH_START, EBOOK_FLASH_END, isEbookFlashActive } from "@/lib/ebook-promotion";
import { EBOOK_BUNDLES } from "@/lib/ebook-bundles";

const during = Date.parse("2026-11-15T15:00:00-03:00");
const start = Date.parse(EBOOK_FLASH_START);
const end = Date.parse(EBOOK_FLASH_END);

describe("Venta flash del 15 de noviembre", () => {
  it("abre a las 00:00 y cierra exactamente a medianoche de Santiago", () => {
    expect(isEbookFlashActive(start - 1)).toBe(false);
    expect(isEbookFlashActive(start)).toBe(true);
    expect(isEbookFlashActive(end - 1)).toBe(true);
    expect(isEbookFlashActive(end)).toBe(false);
    expect(isEbookFlashActive(end + 86400000)).toBe(false);
  });

  it("rebaja 30% del precio vigente de cualquier ebook", () => {
    expect(computeEbookTotal([{ resource: "ebook:agentes-de-ia", price: 27000 }], during).total).toBe(18900);
    expect(computeEbookTotal([{ resource: "ebook:futuro", price: 50000 }], during).total).toBe(35000);
  });

  it.each([
    "ruta-operador", "ruta-negocio", "ruta-constructor",
    "ruta-automatizacion", "coleccion-completa", "coleccion-web",
  ])("rebaja 30% del precio habitual del paquete %s", (slug) => {
    const bundle = EBOOK_BUNDLES.find((item) => item.slug === slug)!;
    const result = computeEbookTotal(bundle.resources.map((resource) => ({ resource, price: 19700 })), during);
    expect(result.total).toBe(Math.round(result.subtotal * 0.7));
    expect(result.discountPercent).toBe(30);
    expect(result.items.reduce((sum, item) => sum + item.amount, 0)).toBe(result.total);
  });

  it("restaura los precios y descuentos habituales al vencer", () => {
    const web = EBOOK_BUNDLES.find((item) => item.slug === "coleccion-web")!;
    const items = web.resources.map((resource, i) => ({ resource, price: i === 0 ? 13700 : 9700 }));
    expect(computeEbookTotal(items, end).total).toBe(32100);
    expect(computeEbookTotal([{ resource: "ebook:agentes-de-ia", price: 27000 }], end).total).toBe(27000);
    expect(computeEbookTotal(items, start - 1).total).toBe(32100);
  });

});
