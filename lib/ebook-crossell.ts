import { getLiveCatalogEntries, type EbookCatalogEntry } from "./ebook-catalog";

const DE_CERO = "ebook:de-cero-a-claude-en-una-semana";
const CLAUDE_EXPERTO = "ebook:claude-nivel-experto";
const AGENTES = "ebook:agentes-de-ia";
const WEBS = "ebook:creacion-de-webs-con-ia";
const WEB_PARTE_2 = "ebook:creacion-de-webs-con-ia-parte-2";
const WEB_PARTE_3 = "ebook:creacion-de-webs-con-ia-parte-3";
const WEB_PARTE_4 = "ebook:creacion-de-webs-con-ia-parte-4";

/**
 * Grafo dirigido de sugerencias: qué ofrecer, y en qué orden, en la página de
 * cada libro. La dependencia es pedagógica, no arbitraria (ver AGENTS.md):
 *
 *     De Cero a Claude ── base de todo
 *         ├─→ Claude a Nivel Experto   (sube el nivel de manejo)
 *         │       └─→ Agentes de IA    (lo aplica al negocio)
 *         └─→ Creación de Webs con IA  (lo aplica a construir web)
 *
 * ANTI-REGLA (dura): "Claude a Nivel Experto" nunca es la sugerencia
 * principal para un visitante sin señales de experiencia previa — el propio
 * libro se autodescribe como avanzado y recomendarlo como primera compra
 * genera reembolsos. Por eso no aparece en `SIN_HISTORIAL` ni es la única
 * entrada en ninguna lista salvo cuando el visitante ya está en la página de
 * un libro que asume esa experiencia (Agentes de IA, o el propio De Cero a
 * Claude como "paso siguiente" explícito).
 */
const CROSS_SELL_GRAPH: Record<string, string[]> = {
  [DE_CERO]: [CLAUDE_EXPERTO, AGENTES, WEBS],
  [AGENTES]: [CLAUDE_EXPERTO, DE_CERO],
  [WEBS]: [WEB_PARTE_2, WEB_PARTE_3, WEB_PARTE_4, DE_CERO],
  [WEB_PARTE_2]: [WEBS, WEB_PARTE_3, WEB_PARTE_4],
  [WEB_PARTE_3]: [WEBS, WEB_PARTE_2, WEB_PARTE_4],
  [WEB_PARTE_4]: [WEBS, WEB_PARTE_2, WEB_PARTE_3],
  [CLAUDE_EXPERTO]: [AGENTES],
};

/** Visitante sin historial (default de cualquier página sin señal de compra previa). */
const SIN_HISTORIAL: string[] = [DE_CERO, AGENTES, WEBS];

/**
 * Libros que la anti-regla prohíbe sugerir a alguien sin señal de experiencia
 * previa. Se aplica también al fallback de "no dejar nada afuera en
 * silencio" — sin este set, ese fallback reintroduciría Claude a Nivel
 * Experto para cualquier visitante sin historial, justo lo que la anti-regla
 * prohíbe.
 */
const REQUIERE_SENAL_DE_EXPERIENCIA = new Set([CLAUDE_EXPERTO]);

/**
 * Devuelve los libros a ofrecer como "sumá otros ebooks" en la página de
 * `resource`, ya priorizados y filtrados a lo que hoy está a la venta
 * (`getLiveCatalogEntries` — respeta tanto `active` como `visibleFrom`, así
 * un libro que aún no se activó no aparece como sugerencia en otra página).
 */
export function getCrossSellEntries(
  resource: string,
  now?: number
): Extract<EbookCatalogEntry, { active: true }>[] {
  const hasExplicitRule = Object.prototype.hasOwnProperty.call(CROSS_SELL_GRAPH, resource);
  const priorityOrder = hasExplicitRule ? CROSS_SELL_GRAPH[resource] : SIN_HISTORIAL;
  const live = getLiveCatalogEntries(now).filter((entry) => entry.resource !== resource);
  const liveByResource = new Map(live.map((entry) => [entry.resource, entry]));

  const ordered = priorityOrder
    .map((r) => liveByResource.get(r))
    .filter((entry): entry is Extract<EbookCatalogEntry, { active: true }> => Boolean(entry));

  // Si `resource` tiene una regla explícita en el grafo, esa lista ES la
  // decisión de negocio — aunque sea corta (ej. Claude Experto solo sugiere
  // Agentes de IA). Completarla con el resto de libros vivos rompería
  // exactamente lo que el grafo quiere evitar (ej. mostrarle Claude Experto
  // a quien está en la página de Webs, que no tiene esa regla).
  if (hasExplicitRule) {
    // Piso de seguridad: si TODO lo que sobrevivió al filtro de "vivo" son
    // libros que requieren señal de experiencia previa (hoy, solo Claude a
    // Nivel Experto), no se muestra solo — la anti-regla dice explícitamente
    // que nunca puede ser la ÚNICA sugerencia. Esto no puede pasar con el
    // catálogo de hoy (los 3 libros nuevos comparten el mismo visibleFrom),
    // pero si algún día se desactiva o pausa un libro por separado (el
    // runbook de AGENTS.md activa de a uno), esta lista podría degenerar a
    // ["ebook:claude-nivel-experto"] solo — mejor no mostrar nada en ese
    // caso que mostrar justo lo que la regla prohíbe.
    const soloRequierenSenal = ordered.every((entry) =>
      REQUIERE_SENAL_DE_EXPERIENCIA.has(entry.resource)
    );
    return ordered.length > 0 && soloRequierenSenal ? [] : ordered;
  }

  // Sin regla explícita (visitante sin historial, o un libro que todavía no
  // se cableó al grafo): mostrar todo lo vivo sin dejar nada afuera en
  // silencio — la anti-regla ya está aplicada arriba, en SIN_HISTORIAL.
  const seen = new Set(ordered.map((e) => e.resource));
  const rest = live.filter(
    (entry) => !seen.has(entry.resource) && !REQUIERE_SENAL_DE_EXPERIENCIA.has(entry.resource)
  );
  return [...ordered, ...rest];
}
