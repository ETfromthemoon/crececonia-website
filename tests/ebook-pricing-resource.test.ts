import { describe, it, expect } from "vitest";
import { getOtherActiveEntries } from "@/lib/ebook-catalog";

describe("getOtherActiveEntries", () => {
  it("excluye el resource dado y devuelve el resto de libros activos", () => {
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others.every((entry) => entry.resource !== "ebook:de-cero-a-claude-en-una-semana")).toBe(
      true
    );
  });

  it("cuando solo hay un libro activo, no hay otros que mostrar", () => {
    const others = getOtherActiveEntries("ebook:de-cero-a-claude-en-una-semana");
    expect(others).toEqual([]);
  });

  it("un resource inactivo o inexistente no excluye nada, devuelve todos los activos", () => {
    const others = getOtherActiveEntries("ebook:no-existe");
    const allActive = getOtherActiveEntries("");
    expect(others).toEqual(allActive);
  });
});
