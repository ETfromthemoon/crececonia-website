import { describe, it, expect, vi } from "vitest";

const DE_CERO = "ebook:de-cero-a-claude-en-una-semana";
const CLAUDE_EXPERTO = "ebook:claude-nivel-experto";

function fakeEntry(resource: string) {
  return {
    resource,
    title: resource,
    subject: resource,
    href: `/ebook/${resource}`,
    coverSrc: "/ebooks/fake.jpg",
    active: true as const,
    tierPrices: { superEarly: 1, early: 1, regular: 1 },
  };
}

// Simula un escenario que el catálogo real de hoy no puede producir (los 3
// libros nuevos comparten el mismo visibleFrom), pero que el runbook de
// AGENTS.md sí habilita a futuro: activar/desactivar libros de a uno. Si
// "Agentes de IA" y "Creación de Webs" se pausan mientras "Claude a Nivel
// Experto" sigue vivo, la lista explícita de De Cero a Claude en el grafo
// ([CLAUDE_EXPERTO, AGENTES, WEBS]) se queda, tras filtrar por vivos, con
// Claude Experto solo — justo lo que la anti-regla prohíbe.
vi.mock("@/lib/ebook-catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ebook-catalog")>();
  return {
    ...actual,
    getLiveCatalogEntries: vi.fn(() => [fakeEntry(DE_CERO), fakeEntry(CLAUDE_EXPERTO)]),
  };
});

import { getCrossSellEntries } from "@/lib/ebook-crossell";

describe("getCrossSellEntries — piso de seguridad de la anti-regla", () => {
  it("si solo sobrevive Claude Experto tras filtrar por vivos, no lo muestra solo", () => {
    // Sin el piso de seguridad, esto devolvería [CLAUDE_EXPERTO] — la única
    // sugerencia en la página de De Cero a Claude sería el libro avanzado,
    // violando la anti-regla aunque nunca se combine con SIN_HISTORIAL.
    const sugerencias = getCrossSellEntries(DE_CERO).map((e) => e.resource);
    expect(sugerencias).toEqual([]);
  });
});
