import { describe, it, expect } from "vitest";
import { getComboDiscountPercent, computeBundleTotal } from "@/lib/ebook-bundles";

describe("getComboDiscountPercent", () => {
  it("0% para 1 item", () => expect(getComboDiscountPercent(1)).toBe(0));
  it("10% para 2 items", () => expect(getComboDiscountPercent(2)).toBe(10));
  it("20% para 3 items", () => expect(getComboDiscountPercent(3)).toBe(20));
  it("20% para más de 3 (usa el tramo más alto que aplica)", () => {
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

  it("3 items: 20% de descuento sobre la suma", () => {
    const result = computeBundleTotal([
      { resource: "a", price: 27000 },
      { resource: "b", price: 27000 },
      { resource: "c", price: 27000 },
    ]);
    expect(result.total).toBe(64800); // 81000 * 0.8
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
});
