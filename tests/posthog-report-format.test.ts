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
  it("incluye el funnel con conteos y el % de conversión final", () => {
    const text = formatAnalyticsReport(baseReport());
    expect(text).toContain("page_view: 100");
    expect(text).toContain("purchase_confirmed: 8");
    expect(text).toContain("8.0%");
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

  it("marca señal accionable cuando n>=30 por variante y la diferencia es >=20% relativo", () => {
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
