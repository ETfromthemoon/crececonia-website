import type { AnalyticsReport, EcosystemMetrics, VariantComparison } from "./posthog-analytics";

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
    `  Tasa de selección de oferta (offer_selected / page_view): ${pct(report.offerSelectionRate)}`,
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

function formatEcosystemSection(metrics?: EcosystemMetrics, byPageType: AnalyticsReport["byPageType"] = []): string {
  if (!metrics) return "Métricas del ecosistema: no disponibles en esta versión del reporte.";

  const pages = byPageType.length > 0
    ? byPageType.map((item) => `${item.pageType}=${item.pageViews}`).join(", ")
    : "sin desglose por categoría";

  return [
    "Métricas del ecosistema:",
    `  eventos totales: ${metrics.eventCount}`,
    `  pageviews propios: ${metrics.pageViews} (${pages}) · enlaces/secciones: ${metrics.linkClicks}/${metrics.sectionViews}`,
    `  CTA semánticos: ${metrics.ctaClicks} · evaluación abierta/enviada/completada: ${metrics.evaluationOpened}/${metrics.evaluationSubmitted}/${metrics.evaluationSucceeded}`,
    `  chat abierto/mensajes/fallbacks: ${metrics.chatOpened}/${metrics.chatMessages}/${metrics.chatFallbacks}`,
    `  newsletter prompts/suscripciones: ${metrics.newsletterPrompts}/${metrics.newsletterSignups}`,
    `  skills vistas/descargas: ${metrics.skillViews}/${metrics.skillDownloads}`,
    `  checkouts solicitados/fallidos/creados/compras: ${metrics.ebookCheckoutRequests}/${metrics.ebookCheckoutFailures}/${metrics.ebookCheckouts}/${metrics.purchases}`,
    `  llamadas solicitadas/completadas: ${metrics.appointmentSubmissions}/${metrics.appointmentSuccesses}`,
    `  calificaciones enviadas: ${metrics.qualificationSubmissions}`,
    `  profundidad 90%: ${metrics.scrollDepth90}`,
  ].join("\n");
}

function formatRecommendations(recommendations?: string[]): string {
  if (!recommendations || recommendations.length === 0) {
    return "Sugerencias: no hay una recomendación prioritaria clara en esta ventana; mantener la instrumentación y acumular volumen.";
  }
  return ["Sugerencias para la página:", ...recommendations.map((item) => `  - ${item}`)].join("\n");
}

export function formatAnalyticsReport(report: AnalyticsReport): string {
  return [
    `Reporte de analytics — generado ${report.generatedAt}`,
    "",
    formatFunnelSection(report),
    "",
    formatEcosystemSection(report.ecosystem, report.byPageType),
    "",
    formatVariantSection(report.byVariant),
    "",
    formatRecommendations(report.recommendations),
  ].join("\n");
}
