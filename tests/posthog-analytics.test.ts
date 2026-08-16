import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HOGQL_RESPONSE = {
  results: [
    ["ebook_bundle_offer_view", null, 18],
    ["ebook_bundle_offer_selected", null, 12],
    ["ebook_checkout_created", null, 22],
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
    vi.resetModules();
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

  it("parsea la respuesta de HogQL en funnel, variantes y selección de oferta", async () => {
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
        { step: "offer_view", count: 18 },
        { step: "offer_selected", count: 12 },
        { step: "checkout_created", count: 22 },
        { step: "purchase_confirmed", count: 9 },
      ])
    );
    expect(report.offerSelectionRate).toBeCloseTo(12 / 120);
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
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, text: async () => "Unauthorized" });
    vi.stubGlobal("fetch", mockFetch);

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-07-30"))).rejects.toThrow(/401/);
  });

  it("agrega métricas del ecosistema y recomendaciones desde la respuesta extendida", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          ["ecosystem_page_view", null, "landing", 0, 100],
          ["ecosystem_link_clicked", null, "landing", 0, 8],
          ["ecosystem_scroll_depth", null, "landing", 90, 12],
          ["evaluation_opened", null, "landing", 0, 10],
          ["evaluation_submit_succeeded", null, "landing", 0, 2],
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-07-30"));

    expect(report.ecosystem).toMatchObject({
      pageViews: 100,
      linkClicks: 8,
      scrollDepth90: 12,
      evaluationOpened: 10,
      evaluationSucceeded: 2,
    });
    expect(report.byPageType).toEqual([{ pageType: "landing", pageViews: 100 }]);
    expect(report.recommendations?.length).toBeGreaterThan(0);
  });
});
