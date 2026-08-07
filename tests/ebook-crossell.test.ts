import { describe, it, expect } from "vitest";
import { getCrossSellEntries } from "@/lib/ebook-crossell";

const DE_CERO = "ebook:de-cero-a-claude-en-una-semana";
const CLAUDE_EXPERTO = "ebook:claude-nivel-experto";
const AGENTES = "ebook:agentes-de-ia";
const WEBS = "ebook:creacion-de-webs-con-ia";

const ANTES_DEL_LANZAMIENTO = new Date("2026-08-07T10:00:00-04:00").getTime();
const DESPUES_DEL_LANZAMIENTO = new Date("2026-08-07T21:00:00-04:00").getTime();

function resourcesOf(resource: string, now: number): string[] {
  return getCrossSellEntries(resource, now).map((e) => e.resource);
}

describe("getCrossSellEntries — grafo dirigido", () => {
  it("De Cero a Claude sugiere Claude Experto primero, luego Agentes y Webs", () => {
    expect(resourcesOf(DE_CERO, DESPUES_DEL_LANZAMIENTO)).toEqual([CLAUDE_EXPERTO, AGENTES, WEBS]);
  });

  it("Agentes de IA sugiere Claude Experto primero, luego De Cero a Claude", () => {
    expect(resourcesOf(AGENTES, DESPUES_DEL_LANZAMIENTO)).toEqual([CLAUDE_EXPERTO, DE_CERO]);
  });

  it("Creación de Webs sugiere De Cero a Claude", () => {
    expect(resourcesOf(WEBS, DESPUES_DEL_LANZAMIENTO)).toEqual([DE_CERO]);
  });

  it("Claude Experto sugiere Agentes de IA (aplicación directa)", () => {
    expect(resourcesOf(CLAUDE_EXPERTO, DESPUES_DEL_LANZAMIENTO)).toEqual([AGENTES]);
  });

  it("nunca incluye el resource de la propia página en sus sugerencias", () => {
    for (const r of [DE_CERO, AGENTES, WEBS, CLAUDE_EXPERTO]) {
      expect(resourcesOf(r, DESPUES_DEL_LANZAMIENTO)).not.toContain(r);
    }
  });
});

describe("getCrossSellEntries — anti-regla: Claude a Nivel Experto", () => {
  it("un visitante sin historial NUNCA ve Claude a Nivel Experto como sugerencia", () => {
    // "Sin historial" = cualquier resource fuera del grafo (no es ninguno de
    // los 4 libros reales). Simula la página de un libro futuro o un estado
    // sin señal de compra previa.
    const sugerencias = resourcesOf("ebook:visitante-sin-historial", DESPUES_DEL_LANZAMIENTO);
    expect(sugerencias).not.toContain(CLAUDE_EXPERTO);
  });

  it("Claude a Nivel Experto no es la ÚNICA sugerencia para un visitante sin historial", () => {
    const sugerencias = resourcesOf("ebook:visitante-sin-historial", DESPUES_DEL_LANZAMIENTO);
    expect(sugerencias.length).toBeGreaterThan(1);
  });

  it("De Cero a Claude sí puede sugerir Claude Experto (es la progresión natural, no un visitante frío)", () => {
    expect(resourcesOf(DE_CERO, DESPUES_DEL_LANZAMIENTO)).toContain(CLAUDE_EXPERTO);
  });
});

describe("getCrossSellEntries — respeta el gating por hora de lanzamiento", () => {
  it("antes del lanzamiento, ningún libro nuevo aparece como sugerencia", () => {
    expect(resourcesOf(DE_CERO, ANTES_DEL_LANZAMIENTO)).toEqual([]);
  });

  it("después del lanzamiento, las sugerencias completas están disponibles", () => {
    expect(resourcesOf(DE_CERO, DESPUES_DEL_LANZAMIENTO)).toHaveLength(3);
  });
});
