import { describe, it, expect } from "vitest";
import { getOtherActiveEntries } from "@/lib/ebook-catalog";

describe("getOtherActiveEntries", () => {
  it("excluye el resource dado y devuelve el resto de libros activos", () => {
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others.every((entry) => entry.resource !== "ebook:de-cero-a-claude-en-una-semana")).toBe(
      true
    );
  });

  it("con varios libros activos, devuelve todos menos el dado", () => {
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others.length).toBeGreaterThan(0);
    expect(others.some((entry) => entry.resource === "ebook:claude-nivel-experto")).toBe(true);
  });

  it("un resource inactivo o inexistente no excluye nada, devuelve todos los activos", () => {
    const others = getOtherActiveEntries("ebook:no-existe");
    const allActive = getOtherActiveEntries("");
    expect(others).toEqual(allActive);
  });
});
