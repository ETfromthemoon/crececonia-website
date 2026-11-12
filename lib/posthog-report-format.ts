import type { AnalyticsReport, EcosystemMetrics, VariantComparison } from "./posthog-analytics";

const MIN_SAMPLE_SIZE = 30;

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatFunnelSection(report: AnalyticsReport): string {
  const lines = report.funnel.map((step) => `  - ${step.step}: ${step.count}`);
  const pageViews = report.funnel.find((s) => s.step === "page_view")?.count ?? 0;
  const purchases = report.funnel.find((s) => s.step === "purchase_confirmed")?.count ?? 0;
  const conversion = pageViews > 0 ? purchases / pageViews : 0;

  return [
    `Actividad de ebooks (últimos ${report.windowDays} días; conteos de eventos):`,
    "  No es un embudo secuencial de personas; los cocientes no miden conversión.",
    ...lines,
    `  Relación agregada (purchase_confirmed / page_view): ${pct(conversion)}`,
    `  Relación agregada de selección de oferta (offer_selected / page_view): ${pct(report.offerSelectionRate)}`,
  ].join("\n");
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

  const detail = byVariant.map((v) => `${v.variant}: ${pct(v.conversionRate)} compras-evento/vistas (n=${v.pageViews})`).join(", ");
  return `Comparación descriptiva de variantes: ${detail}. No permite declarar una variante ganadora: faltan cohortes de personas, orden temporal y evaluación estadística del experimento.`;
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
    `  ebooks: eventos de checkout solicitado/fallido/creado/compra: ${metrics.ebookCheckoutRequests}/${metrics.ebookCheckoutFailures}/${metrics.ebookCheckouts}/${metrics.purchases}`,
    `  solicitudes de llamada intentadas/registradas (no llamadas realizadas): ${metrics.appointmentSubmissions}/${metrics.appointmentSuccesses}`,
    `  aperturas de WhatsApp desde calificación (evento histórico; no envío confirmado): ${metrics.qualificationSubmissions}`,
    `  registros de calificación confirmados/clics de WhatsApp: ${metrics.qualificationSaved ?? 0}/${metrics.qualificationWhatsappClicks ?? 0} (no mensajes confirmados)`,
    `  profundidad 90%: ${metrics.scrollDepth90}`,
  ].join("\n");
}

function formatPurchaseCoverage(report: AnalyticsReport): string {
  if (!report.purchasesByProduct) return "Órdenes únicas: cobertura no disponible en este reporte histórico.";
  return [
    "Compras observadas en PostHog (no conciliación contable):",
    ...report.purchasesByProduct.map((item) => `  ${item.product}: ${item.uniqueOrders} órdenes únicas con ID · ${item.eventCount} eventos · ${item.eventsWithoutOrderId} eventos sin ID (no deduplicables)`),
    "  Deduplicación por producto y order_id dentro de la ventana; no representa compradores únicos ni ingresos.",
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
    formatPurchaseCoverage(report),
    "",
    formatVariantSection(report.byVariant),
    "",
    formatRecommendations(report.recommendations),
  ].join("\n");
}
