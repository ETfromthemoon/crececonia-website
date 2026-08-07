import { describe, it, expect } from "vitest";
import {
  getComboDiscountPercent,
  computeBundleTotal,
  EBOOK_BUNDLES,
  getBundle,
} from "@/lib/ebook-bundles";
import { getCatalogEntry } from "@/lib/ebook-catalog";

describe("getComboDiscountPercent", () => {
  it("0% para 1 item", () => expect(getComboDiscountPercent(1)).toBe(0));
  it("10% para 2 items", () => expect(getComboDiscountPercent(2)).toBe(10));
  it("15% para 3 items", () => expect(getComboDiscountPercent(3)).toBe(15));
  it("20% para 4 items (Colección Completa)", () => expect(getComboDiscountPercent(4)).toBe(20));
  it("20% para más de 4 (usa el tramo más alto que aplica)", () => {
    expect(getComboDiscountPercent(5)).toBe(20);
  });
});

describe("computeBundleTotal", () => {
  it("lanza si la lista está vacía", () => {
    expect(() => computeBundleTotal([])).toThrow();
  });

  it("1 item: sin descuento, el monto completo va a ese item", () => {
    const result = computeBundleTotal([{ resource: "a", price: 27000 }]);
    expect(result.subtotal).toBe(27000);
    expect(result.discountPercent).toBe(0);
    expect(result.total).toBe(27000);
    expect(result.items).toEqual([{ resource: "a", price: 27000, amount: 27000 }]);
  });

  it("2 items: 10% de descuento sobre la suma", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 27000 },
    ]);
    expect(result.subtotal).toBe(54000);
    expect(result.discountPercent).toBe(10);
    expect(result.total).toBe(48600);
    expect(result.discountAmount).toBe(5400);
  });

  it("3 items: 15% de descuento sobre la suma", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 27000 },
      { resource: "c", price: 27000 },
    ]);
    expect(result.discountPercent).toBe(15);
    expect(result.total).toBe(68850); // 81000 * 0.85
  });

  it("4 items: 20% de descuento sobre la suma (Colección Completa)", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 19700 },
      { resource: "c", price: 27000 },
      { resource: "d", price: 19700 },
    ]);
    expect(result.discountPercent).toBe(20);
    expect(result.total).toBe(Math.round((27000 + 19700 + 27000 + 19700) * 0.8));
  });

  it("el reparto proporcional de items suma exacto al total, incluso con precios distintos", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 10800 },
      { resource: "b", price: 17900 },
    ]);
    const sumOfAmounts = result.items.reduce((s, i) => s + i.amount, 0);
    expect(sumOfAmounts).toBe(result.total);
  });

  it("el redondeo se ajusta en el último item, no en el primero", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 33333 },
      { resource: "b", price: 33334 },
    ]);
    const sumOfAmounts = result.items.reduce((s, i) => s + i.amount, 0);
    expect(sumOfAmounts).toBe(result.total);
  });

  it("el reparto cuadra exacto incluso con 4 items de precios distintos", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 19700 },
      { resource: "c", price: 27000 },
      { resource: "d", price: 19700 },
    ]);
    const sumOfAmounts = result.items.reduce((s, i) => s + i.amount, 0);
    expect(sumOfAmounts).toBe(result.total);
  });
});

describe("EBOOK_BUNDLES", () => {
  it("tiene los 4 bundles nombrados del lanzamiento", () => {
    const slugs = EBOOK_BUNDLES.map((b) => b.slug).sort();
    expect(slugs).toEqual(
      ["coleccion-completa", "ruta-constructor", "ruta-negocio", "ruta-operador"].sort()
    );
  });

  it("cada bundle referencia solo resources que existen y están activos en el catálogo", () => {
    for (const bundle of EBOOK_BUNDLES) {
      for (const resource of bundle.resources) {
        const entry = getCatalogEntry(resource);
        expect(entry, `${bundle.slug} referencia ${resource}`).toBeDefined();
        expect(entry!.active, `${bundle.slug} referencia ${resource} inactivo`).toBe(true);
      }
    }
  });

  it("ningún bundle repite un resource", () => {
    for (const bundle of EBOOK_BUNDLES) {
      expect(new Set(bundle.resources).size).toBe(bundle.resources.length);
    }
  });

  it("todo bundle incluye el libro ancla (De cero a Claude) primero", () => {
    // El link de compra de cada bundle apunta a la página del primer resource
    // (?bundle=slug preselecciona el resto) — si el ancla no fuera el primero,
    // el link llevaría a la página equivocada.
    for (const bundle of EBOOK_BUNDLES) {
      expect(bundle.resources[0]).toBe("ebook:de-cero-a-claude-en-una-semana");
    }
  });

  it("Colección Completa incluye los 4 libros", () => {
    const bundle = getBundle("coleccion-completa")!;
    expect(bundle.resources).toHaveLength(4);
  });

  it("Ruta Operador es De Cero a Claude + Claude Experto", () => {
    const bundle = getBundle("ruta-operador")!;
    expect(bundle.resources).toEqual([
      "ebook:de-cero-a-claude-en-una-semana",
      "ebook:claude-nivel-experto",
    ]);
  });

  it("Ruta Negocio es De Cero a Claude + Agentes de IA", () => {
    const bundle = getBundle("ruta-negocio")!;
    expect(bundle.resources).toEqual(["ebook:de-cero-a-claude-en-una-semana", "ebook:agentes-de-ia"]);
  });

  it("Ruta Constructor es De Cero a Claude + Creación de Webs", () => {
    const bundle = getBundle("ruta-constructor")!;
    expect(bundle.resources).toEqual([
      "ebook:de-cero-a-claude-en-una-semana",
      "ebook:creacion-de-webs-con-ia",
    ]);
  });

  it("getBundle devuelve undefined para un slug desconocido", () => {
    expect(getBundle("no-existe")).toBeUndefined();
  });
});
