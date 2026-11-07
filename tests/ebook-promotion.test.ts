import { describe, it, expect } from "vitest";
import { computeEbookTotal, EBOOK_FLASH_START, EBOOK_FLASH_END, isEbookFlashActive } from "@/lib/ebook-promotion";
import { EBOOK_BUNDLES } from "@/lib/ebook-bundles";

const during = Date.parse("2026-11-07T15:00:00-03:00");
const start = Date.parse(EBOOK_FLASH_START);
const end = Date.parse(EBOOK_FLASH_END);

describe("Venta flash del 7 de noviembre", () => {
  it("abre a las 00:00 y cierra exactamente a medianoche de Santiago", () => {
    expect(isEbookFlashActive(start - 1)).toBe(false);
    expect(isEbookFlashActive(start)).toBe(true);
    expect(isEbookFlashActive(end - 1)).toBe(true);
    expect(isEbookFlashActive(end)).toBe(false);
    expect(isEbookFlashActive(end + 86400000)).toBe(false);
  });

  it.each([
    ["de-cero-a-claude-en-una-semana", 8950],
    ["claude-nivel-experto", 6850],
    ["agentes-de-ia", 8950],
    ["creacion-de-webs-con-ia", 6850],
    ["creacion-de-webs-con-ia-parte-2", 4850],
    ["creacion-de-webs-con-ia-parte-3", 4850],
    ["creacion-de-webs-con-ia-parte-4", 4850],
  ])("mantiene el precio anunciado de %s aunque se agote el tramo", (slug, price) => {
    expect(computeEbookTotal([{ resource: `ebook:${slug}`, price: 27000 }], during).total).toBe(price);
  });

  it.each([
    ["ruta-operador", 14220, 50],
    ["ruta-negocio", 16110, 50],
    ["ruta-constructor", 14220, 50],
    ["ruta-automatizacion", 14220, 50],
    ["coleccion-completa", 25280, 50],
    ["coleccion-web", 16050, 50],
  ])("cobra el total aprobado de %s sin acumular descuentos", (slug, total, discount) => {
    const bundle = EBOOK_BUNDLES.find((item) => item.slug === slug)!;
    const result = computeEbookTotal(bundle.resources.map((resource) => ({ resource, price: 19700 })), during);
    expect(result.total).toBe(total);
    expect(result.discountPercent).toBe(discount);
    expect(result.items.reduce((sum, item) => sum + item.amount, 0)).toBe(total);
    expect(computeEbookTotal([...result.items].reverse(), during).total).toBe(total);
  });

  it("restaura los precios y descuentos habituales al vencer", () => {
    const web = EBOOK_BUNDLES.find((item) => item.slug === "coleccion-web")!;
    const items = web.resources.map((resource, i) => ({ resource, price: i === 0 ? 13700 : 9700 }));
    expect(computeEbookTotal(items, end).total).toBe(32100);
    expect(computeEbookTotal([{ resource: "ebook:agentes-de-ia", price: 27000 }], end).total).toBe(27000);
    expect(computeEbookTotal(items, start - 1).total).toBe(32100);
  });

  it("no alcanza futuros productos fuera de la campaña", () => {
    expect(computeEbookTotal([{ resource: "ebook:futuro", price: 50000 }], during).total).toBe(50000);
  });
});
