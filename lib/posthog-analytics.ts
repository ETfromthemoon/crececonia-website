const PROJECT_ID = "533562"; // Settings → General → Project ID en el dashboard de PostHog

export type FunnelStep =
  | "page_view"
  | "offer_view"
  | "offer_selected"
  | "checkout_created"
  | "purchase_confirmed";

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

export interface PageTypeCount {
  pageType: string;
  pageViews: number;
}

export interface EcosystemMetrics {
  eventCount: number;
  pageViews: number;
  linkClicks: number;
  sectionViews: number;
  ctaClicks: number;
  evaluationOpened: number;
  evaluationSubmitted: number;
  evaluationSucceeded: number;
  chatOpened: number;
  chatMessages: number;
  chatFallbacks: number;
  newsletterPrompts: number;
  newsletterSignups: number;
  skillViews: number;
  skillDownloadRequests: number;
  skillDownloads: number;
  ebookCheckoutRequests: number;
  ebookCheckoutFailures: number;
  ebookCheckouts: number;
  purchases: number;
  appointmentSubmissions: number;
  appointmentSuccesses: number;
  qualificationSubmissions: number;
  scrollDepth90: number;
}

export interface AnalyticsReport {
  windowDays: number;
  funnel: FunnelStepResult[];
  byVariant: VariantComparison[];
  offerSelectionRate: number;
  ecosystem?: EcosystemMetrics;
  byPageType?: PageTypeCount[];
  recommendations?: string[];
  generatedAt: string;
}

const EVENT_TO_STEP: Record<string, FunnelStep> = {
  ebook_page_view: "page_view",
  ebook_bundle_offer_view: "offer_view",
  ebook_bundle_offer_selected: "offer_selected",
  ebook_checkout_created: "checkout_created",
  ebook_purchase_confirmed: "purchase_confirmed",
};

// Older client builds emitted this name before the server-side Flow event was
// standardized. It remains a fallback so historical reports do not lose data.
const LEGACY_CHECKOUT_EVENT = "ebook_checkout_started";

const ECOSYSTEM_EVENTS = [
  "ecosystem_page_view",
  "ecosystem_link_clicked",
  "ecosystem_section_viewed",
  "ecosystem_cta_clicked",
  "evaluation_opened",
  "evaluation_step_completed",
  "evaluation_submitted",
  "evaluation_submit_succeeded",
  "evaluation_submit_failed",
  "chat_opened",
  "chat_session_started",
  "chat_message_sent",
  "chat_response_received",
  "chat_lead_captured",
  "chat_fallback",
  "chat_whatsapp_clicked",
  "newsletter_prompt_shown",
  "newsletter_signup_submitted",
  "newsletter_signup_succeeded",
  "newsletter_signup_failed",
  "skill_viewed",
  "skill_download_requested",
  "skill_download_succeeded",
  "skill_download_failed",
  "ebook_checkout_requested",
  "ebook_checkout_failed",
  LEGACY_CHECKOUT_EVENT,
  "ebook_combo_toggle",
  "ebook_checkout_created",
  "ebook_purchase_confirmed",
  "appointment_submitted",
  "appointment_submit_succeeded",
  "appointment_submit_failed",
  "qualification_not_ready",
  "qualification_submitted",
  "ecosystem_scroll_depth",
  ...Object.keys(EVENT_TO_STEP),
];

type HogQlRow = [event: string, variant: string | null, pageType: string | null, depthPercent: number | null, total: number];

function createEmptyMetrics(): EcosystemMetrics {
  return {
    eventCount: 0,
    pageViews: 0,
    linkClicks: 0,
    sectionViews: 0,
    ctaClicks: 0,
    evaluationOpened: 0,
    evaluationSubmitted: 0,
    evaluationSucceeded: 0,
    chatOpened: 0,
    chatMessages: 0,
    chatFallbacks: 0,
    newsletterPrompts: 0,
    newsletterSignups: 0,
    skillViews: 0,
    skillDownloadRequests: 0,
    skillDownloads: 0,
    ebookCheckoutRequests: 0,
    ebookCheckoutFailures: 0,
    ebookCheckouts: 0,
    purchases: 0,
    appointmentSubmissions: 0,
    appointmentSuccesses: 0,
    qualificationSubmissions: 0,
    scrollDepth90: 0,
  };
}

const EVENT_TO_METRIC: Record<string, keyof EcosystemMetrics> = {
  ecosystem_page_view: "pageViews",
  ecosystem_link_clicked: "linkClicks",
  ecosystem_section_viewed: "sectionViews",
  ecosystem_cta_clicked: "ctaClicks",
  evaluation_opened: "evaluationOpened",
  evaluation_submitted: "evaluationSubmitted",
  evaluation_submit_succeeded: "evaluationSucceeded",
  chat_opened: "chatOpened",
  chat_message_sent: "chatMessages",
  chat_fallback: "chatFallbacks",
  newsletter_prompt_shown: "newsletterPrompts",
  newsletter_signup_succeeded: "newsletterSignups",
  skill_viewed: "skillViews",
  skill_download_requested: "skillDownloadRequests",
  skill_download_succeeded: "skillDownloads",
  ebook_checkout_requested: "ebookCheckoutRequests",
  ebook_checkout_failed: "ebookCheckoutFailures",
  ebook_checkout_created: "ebookCheckouts",
  ebook_purchase_confirmed: "purchases",
  appointment_submitted: "appointmentSubmissions",
  appointment_submit_succeeded: "appointmentSuccesses",
  qualification_submitted: "qualificationSubmissions",
};

async function runHogQlQuery(apiKey: string, host: string, sinceIso: string): Promise<HogQlRow[]> {
  const eventList = ECOSYSTEM_EVENTS.map((event) => `'${event}'`).join(", ");
  const query = `
    SELECT
      event,
      JSONExtractString(properties, 'pricing_variant') AS variant,
      JSONExtractString(properties, 'page_type') AS page_type,
      JSONExtractInt(properties, 'depth_percent') AS depth_percent,
      count() AS total
    FROM events
    WHERE event IN (${eventList})
      AND timestamp >= '${sinceIso}'
    GROUP BY event, variant, page_type, depth_percent
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
  return (data.results as unknown[][]).map((row) => {
    // Compatibilidad con respuestas guardadas de la primera versión del reporte.
    if (row.length === 3) {
      const [event, variant, total] = row as unknown as [string, string | null, number];
      return [event, variant, null, null, total] as HogQlRow;
    }
    if (row.length === 4) {
      const [event, variant, pageType, total] = row as unknown as [string, string | null, string | null, number];
      return [event, variant, pageType, null, total] as HogQlRow;
    }
    return row as HogQlRow;
  });
}

export function buildAnalyticsRecommendations(
  metrics: EcosystemMetrics,
  byPageType: PageTypeCount[]
): string[] {
  const recommendations: string[] = [];

  if (metrics.pageViews === 0) {
    recommendations.push("No hay pageviews ecosistémicos en la ventana: verificar la key pública, el dominio de PostHog y el consentimiento/DNT antes de tomar decisiones.");
    return recommendations;
  }

  if (metrics.pageViews >= 100 && metrics.ctaClicks === 0) {
    recommendations.push("Hay tráfico pero ningún CTA semántico registrado: revisar la propuesta principal y añadir un siguiente paso visible en las páginas con más visitas.");
  }

  if (metrics.evaluationOpened >= 10 && metrics.evaluationSucceeded / metrics.evaluationOpened < 0.25) {
    recommendations.push("El formulario de evaluación pierde más del 75% de sus aperturas: revisar longitud, fricción y claridad de los tres pasos antes de cambiar el copy de adquisición.");
  }

  if (metrics.chatMessages >= 10 && metrics.chatFallbacks / metrics.chatMessages >= 0.25) {
    recommendations.push("El chat cae a fallback en al menos 25% de los mensajes: priorizar estabilidad del endpoint y medir las preguntas que activan el fallback.");
  }

  if (metrics.ebookCheckoutRequests > 0 && metrics.ebookCheckouts === 0) {
    recommendations.push("Hay intención de compra pero ningún checkout creado: revisar errores del endpoint de Flow y la continuidad del formulario de pago.");
  }

  if (metrics.ebookCheckoutFailures > 0) {
    recommendations.push(`Se registraron ${metrics.ebookCheckoutFailures} fallos de checkout: revisar la categoria del error y el proveedor de pago antes de cambiar precios o copy.`);
  }

  if (metrics.ebookCheckouts > 0 && metrics.purchases === 0) {
    recommendations.push("Hay checkouts creados pero ninguna compra confirmada: revisar webhook/confirmación de Flow y la entrega posterior antes de optimizar precios.");
  }

  if (metrics.skillViews >= 20 && metrics.skillDownloads / metrics.skillViews < 0.1) {
    recommendations.push("Las skills reciben visitas pero pocas descargas: probar un CTA de descarga más temprano y una explicación más concreta del beneficio.");
  }

  if (metrics.newsletterPrompts >= 20 && metrics.newsletterSignups / metrics.newsletterPrompts < 0.03) {
    recommendations.push("La conversión del popup de newsletter es menor al 3%: probar momento de aparición, promesa y fricción del formulario.");
  }

  if (metrics.pageViews >= 50 && metrics.scrollDepth90 / metrics.pageViews < 0.15) {
    recommendations.push("Pocos visitantes llegan al 90% de las páginas: revisar jerarquía del primer viewport y mover el CTA más importante hacia arriba.");
  }

  const topPage = [...byPageType].sort((a, b) => b.pageViews - a.pageViews)[0];
  if (topPage && topPage.pageViews >= 50 && metrics.ctaClicks / topPage.pageViews < 0.01) {
    recommendations.push(`La categoría ${topPage.pageType} concentra tráfico pero casi no genera CTA: revisar su siguiente paso y enlazado interno.`);
  }

  return recommendations;
}

/**
 * Consulta el estado del ecosistema para los últimos `windowDays` días.
 * `now` se recibe como parámetro para que el reporte sea determinista y testeable.
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
    offer_view: 0,
    offer_selected: 0,
    checkout_created: 0,
    purchase_confirmed: 0,
  };
  const metrics = createEmptyMetrics();
  const pageTypeTotals = new Map<string, number>();
  const variantTotals = new Map<string, { pageViews: number; checkoutsStarted: number; purchasesConfirmed: number }>();
  const legacyCheckoutByVariant = new Map<string, number>();
  let legacyCheckoutTotal = 0;

  for (const [event, variant, pageType, depthPercent, total] of rows) {
    if (event === LEGACY_CHECKOUT_EVENT) {
      legacyCheckoutTotal += total;
      if (variant) legacyCheckoutByVariant.set(variant, (legacyCheckoutByVariant.get(variant) ?? 0) + total);
    }

    const step = EVENT_TO_STEP[event];
    if (step) funnelTotals[step] += total;

    metrics.eventCount += total;
    const metric = EVENT_TO_METRIC[event];
    if (metric) metrics[metric] += total;
    if (event === "ecosystem_scroll_depth" && depthPercent === 90) metrics.scrollDepth90 += total;

    if (event === "ecosystem_page_view" && pageType) {
      pageTypeTotals.set(pageType, (pageTypeTotals.get(pageType) ?? 0) + total);
    }

    if (variant) {
      const entry = variantTotals.get(variant) ?? { pageViews: 0, checkoutsStarted: 0, purchasesConfirmed: 0 };
      if (step === "page_view") entry.pageViews += total;
      if (step === "checkout_created") entry.checkoutsStarted += total;
      if (step === "purchase_confirmed") entry.purchasesConfirmed += total;
      variantTotals.set(variant, entry);
    }
  }

  // Prefer the canonical server event. If only the legacy client event exists,
  // use it as a fallback so the funnel remains continuous across deployments.
  if (funnelTotals.checkout_created === 0 && legacyCheckoutTotal > 0) {
    funnelTotals.checkout_created = legacyCheckoutTotal;
    for (const [variant, total] of legacyCheckoutByVariant) {
      const entry = variantTotals.get(variant) ?? { pageViews: 0, checkoutsStarted: 0, purchasesConfirmed: 0 };
      entry.checkoutsStarted += total;
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
  const byPageType: PageTypeCount[] = Array.from(pageTypeTotals.entries()).map(([pageType, pageViews]) => ({ pageType, pageViews }));
  const pageViews = funnelTotals.page_view > 0 ? funnelTotals.page_view : metrics.pageViews;
  const offerSelectionRate = pageViews > 0 ? funnelTotals.offer_selected / pageViews : 0;

  metrics.purchases = funnelTotals.purchase_confirmed;
  metrics.ebookCheckouts = funnelTotals.checkout_created;

  return {
    windowDays,
    funnel,
    byVariant,
    offerSelectionRate,
    ecosystem: metrics,
    byPageType,
    recommendations: buildAnalyticsRecommendations(metrics, byPageType),
    generatedAt: now.toISOString(),
  };
}
