# Reporte periódico de PostHog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consultar el funnel de venta de ebooks vía la API de HogQL de PostHog, formatear un reporte legible, y dejar la infraestructura de código lista para que un cron semanal (fuera de este repo) lo ejecute y notifique al usuario.

**Architecture:** `lib/posthog-analytics.ts` hace la consulta HogQL cruda vía `fetch` con la Personal API Key. `lib/posthog-report-format.ts` (función pura, sin I/O) convierte el resultado en texto legible, aplicando el umbral de señal (n≥30, diferencia≥20pp). `scripts/posthog-report.ts` conecta ambas piezas y se ejecuta con `tsx`.

**Tech Stack:** TypeScript, vitest, `tsx` (nuevo devDependency para correr scripts `.ts` sueltos sin compilar).

## Global Constraints

- `POSTHOG_PERSONAL_API_KEY` es server-only, nunca `NEXT_PUBLIC_`.
- Sin esa key, `fetchAnalyticsReport` lanza un error explícito (a diferencia de `lib/analytics.ts`, que es no-op — acá el consumidor es un script ejecutado a propósito, no cada visita de usuario).
- Umbral de señal: n≥30 page views por variante Y diferencia de conversión ≥20 puntos porcentuales relativos. Si no se cumple, el reporte lo declara explícitamente.
- Nunca usar `Date.now()`/`new Date()` implícito dentro de las funciones testeadas — `now: Date` siempre se pasa como parámetro.
- `npm test` y `npm run build` deben seguir en verde.

---

### Task 1: `lib/posthog-analytics.ts` — query layer contra HogQL

**Files:**
- Create: `lib/posthog-analytics.ts`
- Test: `tests/posthog-analytics.test.ts`

**Interfaces:**
- Produces: `fetchAnalyticsReport(windowDays: number, now: Date): Promise<AnalyticsReport>`, tipos `FunnelStepResult`, `VariantComparison`, `AnalyticsReport` — consumidos por Task 3 (`scripts/posthog-report.ts`).

- [ ] **Step 1: Escribir el test que fija el contrato (falla primero)**

```typescript
// tests/posthog-analytics.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HOGQL_RESPONSE = {
  results: [
    ["ebook_page_view", null, 120],
    ["ebook_combo_toggle", null, 18],
    ["ebook_checkout_started", null, 22],
    ["ebook_purchase_confirmed", null, 9],
    ["ebook_page_view", "control", 61],
    ["ebook_page_view", "variant-b", 59],
    ["ebook_purchase_confirmed", "control", 3],
    ["ebook_purchase_confirmed", "variant-b", 6],
  ],
};

describe("fetchAnalyticsReport", () => {
  const originalKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const originalHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  beforeEach(() => {
    process.env.POSTHOG_PERSONAL_API_KEY = "phx_test_key";
    process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://us.i.posthog.com";
  });

  afterEach(() => {
    process.env.POSTHOG_PERSONAL_API_KEY = originalKey;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = originalHost;
    vi.unstubAllGlobals();
  });

  it("lanza si POSTHOG_PERSONAL_API_KEY no está configurada", async () => {
    delete process.env.POSTHOG_PERSONAL_API_KEY;
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-07-30"))).rejects.toThrow(
      /POSTHOG_PERSONAL_API_KEY/
    );
  });

  it("parsea la respuesta de HogQL en funnel, byVariant y comboToggleRate", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => HOGQL_RESPONSE,
    });
    vi.stubGlobal("fetch", mockFetch);

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-07-30"));

    expect(report.windowDays).toBe(7);
    expect(report.generatedAt).toBe("2026-07-30T00:00:00.000Z");
    expect(report.funnel).toEqual(
      expect.arrayContaining([
        { step: "page_view", count: 120 },
        { step: "combo_toggle", count: 18 },
        { step: "checkout_started", count: 22 },
        { step: "purchase_confirmed", count: 9 },
      ])
    );
    expect(report.comboToggleRate).toBeCloseTo(18 / 120);
    expect(report.byVariant).toEqual(
      expect.arrayContaining([
        {
          variant: "control",
          pageViews: 61,
          checkoutsStarted: 0,
          purchasesConfirmed: 3,
          conversionRate: 3 / 61,
        },
        {
          variant: "variant-b",
          pageViews: 59,
          checkoutsStarted: 0,
          purchasesConfirmed: 6,
          conversionRate: 6 / 59,
        },
      ])
    );
  });

  it("lanza un error legible si la API de PostHog responde con error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => "Unauthorized" });
    vi.stubGlobal("fetch", mockFetch);

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-07-30"))).rejects.toThrow(/401/);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- tests/posthog-analytics.test.ts`
Expected: FAIL, `lib/posthog-analytics.ts` no existe.

- [ ] **Step 3: Implementar `lib/posthog-analytics.ts`**

```typescript
const PROJECT_ID = "533562"; // Settings → General → Project ID en el dashboard de PostHog

export type FunnelStep = "page_view" | "combo_toggle" | "checkout_started" | "purchase_confirmed";

export interface FunnelStepResult {
  step: FunnelStep;
  count: number;
}

export interface VariantComparison {
  variant: string;
  pageViews: number;
  checkoutsStarted: number;
  purchasesConfirmed: number;
  conversionRate: number;
}

export interface AnalyticsReport {
  windowDays: number;
  funnel: FunnelStepResult[];
  byVariant: VariantComparison[];
  comboToggleRate: number;
  generatedAt: string;
}

const EVENT_TO_STEP: Record<string, FunnelStep> = {
  ebook_page_view: "page_view",
  ebook_combo_toggle: "combo_toggle",
  ebook_checkout_started: "checkout_started",
  ebook_purchase_confirmed: "purchase_confirmed",
};

interface HogQlRow {
  0: string; // event
  1: string | null; // pricing_variant (puede venir null)
  2: number; // count
}

async function runHogQlQuery(apiKey: string, host: string, sinceIso: string): Promise<HogQlRow[]> {
  const query = `
    SELECT event, JSONExtractString(properties, 'pricing_variant') AS variant, count() AS total
    FROM events
    WHERE event IN ('ebook_page_view', 'ebook_combo_toggle', 'ebook_checkout_started', 'ebook_purchase_confirmed')
      AND timestamp >= '${sinceIso}'
    GROUP BY event, variant
  `;

  const res = await fetch(`${host}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });

  if (!res.ok) {
    throw new Error(`PostHog HogQL query falló (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return data.results as HogQlRow[];
}

/**
 * Consulta el funnel de venta de ebooks en PostHog para los últimos
 * `windowDays` días contados desde `now`. `now` siempre se recibe como
 * parámetro (nunca Date.now() interno) para que el resultado sea
 * determinístico y testeable.
 */
export async function fetchAnalyticsReport(windowDays: number, now: Date): Promise<AnalyticsReport> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "POSTHOG_PERSONAL_API_KEY no configurada — necesaria para consultar analytics (distinta del project token phc_...)."
    );
  }
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  const since = new Date(now);
  since.setDate(since.getDate() - windowDays);

  const rows = await runHogQlQuery(apiKey, host, since.toISOString());

  const funnelTotals: Record<FunnelStep, number> = {
    page_view: 0,
    combo_toggle: 0,
    checkout_started: 0,
    purchase_confirmed: 0,
  };

  const variantTotals = new Map<string, { pageViews: number; checkoutsStarted: number; purchasesConfirmed: number }>();

  for (const row of rows) {
    const [event, variant, total] = row;
    const step = EVENT_TO_STEP[event];
    if (!step) continue;

    funnelTotals[step] += total;

    if (variant) {
      const entry = variantTotals.get(variant) ?? { pageViews: 0, checkoutsStarted: 0, purchasesConfirmed: 0 };
      if (step === "page_view") entry.pageViews += total;
      if (step === "checkout_started") entry.checkoutsStarted += total;
      if (step === "purchase_confirmed") entry.purchasesConfirmed += total;
      variantTotals.set(variant, entry);
    }
  }

  const funnel: FunnelStepResult[] = (Object.keys(funnelTotals) as FunnelStep[]).map((step) => ({
    step,
    count: funnelTotals[step],
  }));

  const byVariant: VariantComparison[] = Array.from(variantTotals.entries()).map(([variant, totals]) => ({
    variant,
    ...totals,
    conversionRate: totals.pageViews > 0 ? totals.purchasesConfirmed / totals.pageViews : 0,
  }));

  const comboToggleRate = funnelTotals.page_view > 0 ? funnelTotals.combo_toggle / funnelTotals.page_view : 0;

  return {
    windowDays,
    funnel,
    byVariant,
    comboToggleRate,
    generatedAt: now.toISOString(),
  };
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- tests/posthog-analytics.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/posthog-analytics.ts tests/posthog-analytics.test.ts
git commit -m "feat: agrega query layer de HogQL para el funnel de ebooks"
```

---

### Task 2: `lib/posthog-report-format.ts` — formato de texto + umbral de señal

**Files:**
- Create: `lib/posthog-report-format.ts`
- Test: `tests/posthog-report-format.test.ts`

**Interfaces:**
- Consumes: `AnalyticsReport`, `VariantComparison` de `lib/posthog-analytics.ts` (Task 1).
- Produces: `formatAnalyticsReport(report: AnalyticsReport): string` — consumido por Task 3.

- [ ] **Step 1: Escribir el test (falla primero)**

```typescript
// tests/posthog-report-format.test.ts
import { describe, it, expect } from "vitest";
import { formatAnalyticsReport } from "@/lib/posthog-report-format";
import type { AnalyticsReport } from "@/lib/posthog-analytics";

function baseReport(overrides: Partial<AnalyticsReport> = {}): AnalyticsReport {
  return {
    windowDays: 7,
    funnel: [
      { step: "page_view", count: 100 },
      { step: "combo_toggle", count: 10 },
      { step: "checkout_started", count: 20 },
      { step: "purchase_confirmed", count: 8 },
    ],
    byVariant: [],
    comboToggleRate: 0.1,
    generatedAt: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("formatAnalyticsReport", () => {
  it("incluye el funnel con conteos y el % de conversión final", () => {
    const text = formatAnalyticsReport(baseReport());
    expect(text).toContain("page_view: 100");
    expect(text).toContain("purchase_confirmed: 8");
    expect(text).toContain("8.0%"); // 8/100
  });

  it("declara falta de volumen cuando alguna variante tiene menos de 30 page views", () => {
    const report = baseReport({
      byVariant: [
        { variant: "control", pageViews: 20, checkoutsStarted: 2, purchasesConfirmed: 1, conversionRate: 0.05 },
        { variant: "variant-b", pageViews: 59, checkoutsStarted: 5, purchasesConfirmed: 6, conversionRate: 0.1 },
      ],
    });
    const text = formatAnalyticsReport(report);
    expect(text).toMatch(/todavía no hay volumen suficiente/i);
    expect(text).toContain("20");
    expect(text).toContain("59");
  });

  it("marca señal accionable cuando n>=30 por variante y la diferencia es >=20pp relativos", () => {
    const report = baseReport({
      byVariant: [
        { variant: "control", pageViews: 61, checkoutsStarted: 5, purchasesConfirmed: 3, conversionRate: 3 / 61 },
        { variant: "variant-b", pageViews: 59, checkoutsStarted: 8, purchasesConfirmed: 6, conversionRate: 6 / 59 },
      ],
    });
    const text = formatAnalyticsReport(report);
    expect(text).toMatch(/señal accionable/i);
    expect(text).toContain("variant-b");
  });

  it("no marca señal si el n alcanza pero la diferencia es menor al umbral", () => {
    const report = baseReport({
      byVariant: [
        { variant: "control", pageViews: 100, checkoutsStarted: 10, purchasesConfirmed: 5, conversionRate: 0.05 },
        { variant: "variant-b", pageViews: 100, checkoutsStarted: 11, purchasesConfirmed: 5, conversionRate: 0.05 },
      ],
    });
    const text = formatAnalyticsReport(report);
    expect(text).not.toMatch(/señal accionable/i);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- tests/posthog-report-format.test.ts`
Expected: FAIL, el módulo no existe.

- [ ] **Step 3: Implementar `lib/posthog-report-format.ts`**

```typescript
import type { AnalyticsReport, VariantComparison } from "./posthog-analytics";

const MIN_SAMPLE_SIZE = 30;
const MIN_RELATIVE_DIFFERENCE = 0.2; // 20% relativo, no 20 puntos porcentuales absolutos

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatFunnelSection(report: AnalyticsReport): string {
  const lines = report.funnel.map((step) => `  - ${step.step}: ${step.count}`);
  const pageViews = report.funnel.find((s) => s.step === "page_view")?.count ?? 0;
  const purchases = report.funnel.find((s) => s.step === "purchase_confirmed")?.count ?? 0;
  const conversion = pageViews > 0 ? purchases / pageViews : 0;

  return [
    `Funnel (últimos ${report.windowDays} días):`,
    ...lines,
    `  Conversión total (page_view → purchase_confirmed): ${pct(conversion)}`,
    `  Tasa de combo (ebook_combo_toggle / page_view): ${pct(report.comboToggleRate)}`,
  ].join("\n");
}

function relativeDifference(a: number, b: number): number {
  const base = Math.min(a, b);
  if (base === 0) return a === b ? 0 : Infinity;
  return Math.abs(a - b) / base;
}

function formatVariantSection(byVariant: VariantComparison[]): string {
  if (byVariant.length < 2) {
    return "Comparación de variantes: no hay suficientes variantes con datos en esta ventana.";
  }

  const belowThreshold = byVariant.filter((v) => v.pageViews < MIN_SAMPLE_SIZE);
  if (belowThreshold.length > 0) {
    const detail = byVariant.map((v) => `${v.variant}=${v.pageViews} vistas`).join(", ");
    return `Comparación de variantes: todavía no hay volumen suficiente para comparar (mínimo ${MIN_SAMPLE_SIZE} vistas por variante) — ${detail}.`;
  }

  const [a, b] = [...byVariant].sort((x, y) => y.conversionRate - x.conversionRate);
  const diff = relativeDifference(a.conversionRate, b.conversionRate);
  const detail = byVariant
    .map((v) => `${v.variant}: ${pct(v.conversionRate)} (n=${v.pageViews})`)
    .join(", ");

  if (diff >= MIN_RELATIVE_DIFFERENCE) {
    return `Comparación de variantes: ${detail}. ⚠️ Señal accionable — "${a.variant}" convierte ${(diff * 100).toFixed(0)}% mejor (relativo) que el resto.`;
  }

  return `Comparación de variantes: ${detail}. Sin señal accionable todavía (diferencia menor al ${(MIN_RELATIVE_DIFFERENCE * 100).toFixed(0)}% relativo).`;
}

export function formatAnalyticsReport(report: AnalyticsReport): string {
  return [
    `Reporte de analytics — generado ${report.generatedAt}`,
    "",
    formatFunnelSection(report),
    "",
    formatVariantSection(report.byVariant),
  ].join("\n");
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- tests/posthog-report-format.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/posthog-report-format.ts tests/posthog-report-format.test.ts
git commit -m "feat: formatea el reporte de analytics con umbral de señal accionable"
```

---

### Task 3: Script ejecutable + atajo de npm

**Files:**
- Create: `scripts/posthog-report.ts`
- Modify: `package.json` (agregar `tsx` como devDependency y el script `posthog:report`)

**Interfaces:**
- Consumes: `fetchAnalyticsReport` (Task 1), `formatAnalyticsReport` (Task 2).

- [ ] **Step 1: Instalar `tsx`**

Run: `npm install -D tsx`
Expected: `package.json`/`package-lock.json` actualizados.

- [ ] **Step 2: Crear `scripts/posthog-report.ts`**

```typescript
import { fetchAnalyticsReport } from "../lib/posthog-analytics";
import { formatAnalyticsReport } from "../lib/posthog-report-format";

async function main() {
  const windowDaysArg = process.argv[2];
  const windowDays = windowDaysArg ? Number(windowDaysArg) : 7;

  if (!Number.isFinite(windowDays) || windowDays <= 0) {
    console.error("Uso: npm run posthog:report -- [dias]  (dias debe ser un número positivo, default 7)");
    process.exit(1);
  }

  const report = await fetchAnalyticsReport(windowDays, new Date());
  console.log(formatAnalyticsReport(report));
}

main().catch((err) => {
  console.error("Falló la generación del reporte:", err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 3: Agregar el atajo de npm**

En `package.json`, dentro de `"scripts"`:

```json
"posthog:report": "tsx scripts/posthog-report.ts"
```

- [ ] **Step 4: Verificar que el script corre (con la key real en `.env.local`, si está disponible)**

Run: `npm run posthog:report`
Expected: imprime el reporte en texto. Si `POSTHOG_PERSONAL_API_KEY` no está en el shell actual (los scripts de npm no cargan `.env.local` automáticamente fuera de Next.js), usar `node -r dotenv/config` o exportar la variable manualmente para esta verificación puntual — no hace falta agregar `dotenv` como dependencia solo para esto si ya se exporta la env var a mano en la sesión de verificación.

- [ ] **Step 5: Typecheck y test suite completos**

Run: `npm run build`
Expected: sin errores (el script en `scripts/` no forma parte del build de Next.js — confirmar que `tsconfig.json` no lo excluye de forma que rompa el typecheck del resto, y si lo incluye, que compile limpio).

Run: `npm test`
Expected: todos los tests pasan.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/posthog-report.ts
git commit -m "feat: agrega script ejecutable para el reporte de PostHog (npm run posthog:report)"
```

---

### Task 4: Documentar el cron en AGENTS.md + verificación manual

**Files:**
- Modify: `AGENTS.md` (agregar sección breve sobre el reporte y cómo programarlo)

**Interfaces:** ninguna (documentación).

- [ ] **Step 1: Agregar una sección corta a `AGENTS.md`**

Después de la sección "Runbook: activar un ebook nuevo", agregar:

```markdown
## Reporte de analytics de PostHog

`npm run posthog:report -- [dias]` (default 7) imprime un resumen del funnel
de venta de ebooks (`lib/posthog-analytics.ts` + `lib/posthog-report-format.ts`).
Requiere `POSTHOG_PERSONAL_API_KEY` (Personal API Key de PostHog con scope de
lectura, distinta del project token `phc_...` usado para capturar eventos).

Para que corra solo cada semana y avise al usuario, se programa como un cron
del harness de Claude Code (skill `schedule`), no como código de este repo —
el cron ejecuta el script, y si el reporte marca "señal accionable" en la
comparación de variantes, se le pregunta al usuario antes de generar
cualquier PR de cambio (nunca automático).
```

- [ ] **Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "docs: documenta npm run posthog:report en AGENTS.md"
```

---

### Task 5: Programar el cron semanal + PR

**Files:** ninguno de código — uso de la skill `schedule` de este harness.

- [ ] **Step 1: Crear el cron semanal**

Usar la skill `schedule` (o la tool `CronCreate` directamente) para programar
un agente semanal (ej. lunes 9am hora de Chile) cuyo prompt sea: correr
`npm run posthog:report` en este repo, leer el resultado, y notificar al
usuario con el resumen. Si el resumen contiene "señal accionable", el prompt
debe pedirle explícitamente al usuario una propuesta de cambio antes de
tocar cualquier archivo — nunca crear un PR sin esa aprobación.

- [ ] **Step 2: Push de la rama y PR**

```bash
git push -u origin feat/posthog-analytics-report
gh pr create --title "feat: reporte periódico de analytics de PostHog" --body "$(cat <<'EOF'
## Summary
- Agrega `lib/posthog-analytics.ts`: consulta HogQL del funnel de venta de ebooks (requiere `POSTHOG_PERSONAL_API_KEY`, Personal API Key de scope lectura).
- Agrega `lib/posthog-report-format.ts`: formatea el reporte en texto y marca "señal accionable" solo con n≥30 por variante y diferencia ≥20% relativo.
- Agrega `npm run posthog:report` para correrlo a mano o desde un cron.
- Documenta en AGENTS.md cómo se programa el cron semanal (fuera del código, vía la skill `schedule` del harness) y el flujo de aprobación antes de cualquier PR de cambio.

Ver spec en `docs/superpowers/specs/2026-07-30-posthog-analytics-report-design.md`.

## Test plan
- [x] `npm test` — nuevos tests de query layer y formato en verde
- [x] `npm run build` — sin errores
- [ ] Confirmar que `npm run posthog:report` corre contra la API real de PostHog con `POSTHOG_PERSONAL_API_KEY` cargada
EOF
)"
```

- [ ] **Step 3: Reportar la URL del PR y del cron creado al usuario**

No mergear — mismo criterio que el PR anterior.
