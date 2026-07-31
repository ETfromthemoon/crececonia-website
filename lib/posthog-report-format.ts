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
  const detail = byVariant.map((v) => `${v.variant}: ${pct(v.conversionRate)} (n=${v.pageViews})`).join(", ");

  if (diff >= MIN_RELATIVE_DIFFERENCE) {
    return `Comparación de variantes: ${detail}. ⚠️ Señal accionable — "${a.variant}" convierte ${(diff * 100).toFixed(0)}% mejor (relativo) que el resto.`;
  }

  return `Comparación de variantes: ${detail}. Diferencia insuficiente para recomendar un cambio (menor al ${(MIN_RELATIVE_DIFFERENCE * 100).toFixed(0)}% relativo).`;
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
