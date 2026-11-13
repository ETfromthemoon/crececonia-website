import { describe, it, expect } from "vitest";
import { formatAnalyticsReport } from "@/lib/posthog-report-format";
import type { AnalyticsReport } from "@/lib/posthog-analytics";

function baseReport(overrides: Partial<AnalyticsReport> = {}): AnalyticsReport {
  return {
    windowDays: 7,
    funnel: [
      { step: "page_view", count: 100 },
      { step: "offer_view", count: 15 },
      { step: "offer_selected", count: 10 },
      { step: "checkout_created", count: 20 },
      { step: "purchase_confirmed", count: 8 },
    ],
    byVariant: [],
    offerSelectionRate: 0.1,
    generatedAt: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("formatAnalyticsReport", () => {
  it("identifica conteos agregados sin afirmar conversión por persona", () => {
    const text = formatAnalyticsReport(baseReport());
    expect(text).toContain("page_view: 100");
    expect(text).toContain("purchase_confirmed: 8");
    expect(text).toContain("8.0%");
    expect(text).toContain("No es un embudo secuencial");
    expect(text).not.toContain("Conversión total");
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

  it("no declara ganadora una variante aunque el cociente agregado difiera mucho", () => {
    const report = baseReport({
      byVariant: [
        { variant: "control", pageViews: 61, checkoutsStarted: 5, purchasesConfirmed: 3, conversionRate: 3 / 61 },
        { variant: "variant-b", pageViews: 59, checkoutsStarted: 8, purchasesConfirmed: 6, conversionRate: 6 / 59 },
      ],
    });
    const text = formatAnalyticsReport(report);
    expect(text).not.toMatch(/señal accionable/i);
    expect(text).toContain("No permite declarar una variante ganadora");
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
  it("informa cobertura por producto sin convertir eventos sin ID en órdenes", () => {
    const text = formatAnalyticsReport(baseReport({ purchasesByProduct: [
      { product: "ebook", eventCount: 9, uniqueOrders: 2, eventsWithoutOrderId: 3 },
    ] }));
    expect(text).toContain("2 órdenes únicas con ID");
    expect(text).toContain("3 eventos sin ID (no deduplicables)");
    expect(text).toContain("no conciliación contable");
  });

  it("explica el cociente enlazado por orden y su cohorte madura sin presentarlo como contabilidad", () => {
    const text = formatAnalyticsReport(baseReport({ ebookOrderConversion: {
      maturityDays: 14,
      eligibleCheckouts: 7,
      confirmedWithinWindow: 4,
      checkoutEventsWithoutOrderId: 2,
      conversionRate: 4 / 7,
    } }));
    expect(text).toContain("4/7 checkouts maduros");
    expect(text).toContain("57.1%");
    expect(text).toContain("2 eventos de checkout sin ID");
    expect(text).toContain("no conciliación contable");
    expect(text).toContain("14 días completos de observación");
  });

  it("no inventa una tasa si la cohorte no tiene órdenes elegibles", () => {
    const text = formatAnalyticsReport(baseReport({ ebookOrderConversion: {
      maturityDays: 14,
      eligibleCheckouts: 0,
      confirmedWithinWindow: 0,
      checkoutEventsWithoutOrderId: 0,
      conversionRate: null,
    } }));
    expect(text).toContain("sin órdenes elegibles");
  });

  it("muestra el desglose semántico CTA/origen disponible", () => {
    const text = formatAnalyticsReport(baseReport({
      ecosystem: { eventCount: 6, pageViews: 0, linkClicks: 0, sectionViews: 0, ctaClicks: 6,
        evaluationOpened: 0, evaluationSubmitted: 0, evaluationSucceeded: 0, chatOpened: 0, chatMessages: 0,
        chatFallbacks: 0, newsletterPrompts: 0, newsletterSignups: 0, skillViews: 0, skillDownloadRequests: 0,
        skillDownloads: 0, ebookCheckoutRequests: 0, ebookCheckoutFailures: 0, ebookCheckouts: 0, purchases: 0,
        marketplaceSearches: 0, marketplaceFilters: 0, marketplaceBookSelections: 0,
        appointmentSubmissions: 0, appointmentSuccesses: 0, qualificationSubmissions: 0,
        qualificationSaved: 0, qualificationWhatsappClicks: 0, scrollDepth90: 0 },
      semanticCtaBreakdown: [{ cta: "home_route", source: "home_hero", clicks: 6 }],
    }));
    expect(text).toContain("CTA por ruta/origen: home_route/home_hero=6");
  });

});
