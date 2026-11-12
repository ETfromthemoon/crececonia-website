import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HOGQL_RESPONSE = {
  results: [
    ["ebook_bundle_offer_view", null, 18],
    ["ebook_bundle_offer_selected", null, 12],
    ["ebook_checkout_created", null, 22],
    ["ebook_checkout_failed", null, 2],
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
    vi.stubGlobal("fetch", (url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      if (query.includes("AS eligible_checkouts")) return Promise.resolve({ ok: true, json: async () => ({ results: [[0, 0, 0]] }) });
      if (query.includes("AS unique_orders")) return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      return mockFetch(url, options);
    });

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
    expect(report.ecosystem?.ebookCheckoutFailures).toBe(2);
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
    vi.stubGlobal("fetch", (url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      if (query.includes("AS eligible_checkouts")) return Promise.resolve({ ok: true, json: async () => ({ results: [[0, 0, 0]] }) });
      if (query.includes("AS unique_orders")) return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      return mockFetch(url, options);
    });

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-07-30"))).rejects.toThrow(/401/);
  });

  it("usa ebook_checkout_started como fallback historico si no existe el evento canonico", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          ["ebook_page_view", "control", 10],
          ["ebook_checkout_started", "control", 4],
          ["ebook_purchase_confirmed", "control", 1],
        ],
      }),
    });
    vi.stubGlobal("fetch", (url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      if (query.includes("AS eligible_checkouts")) return Promise.resolve({ ok: true, json: async () => ({ results: [[0, 0, 0]] }) });
      if (query.includes("AS unique_orders")) return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      return mockFetch(url, options);
    });

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-07-30"));

    expect(report.funnel).toEqual(
      expect.arrayContaining([{ step: "checkout_created", count: 4 }])
    );
    expect(report.ecosystem?.ebookCheckouts).toBe(4);
    expect(report.byVariant).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ variant: "control", checkoutsStarted: 4 }),
      ])
    );
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
          ["qualification_saved", null, "landing", 0, 3],
          ["qualification_whatsapp_clicked", null, "landing", 0, 2],
        ],
      }),
    });
    vi.stubGlobal("fetch", (url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      if (query.includes("AS eligible_checkouts")) return Promise.resolve({ ok: true, json: async () => ({ results: [[0, 0, 0]] }) });
      if (query.includes("AS unique_orders")) return Promise.resolve({ ok: true, json: async () => ({ results: [] }) });
      return mockFetch(url, options);
    });

    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-07-30"));

    expect(report.ecosystem).toMatchObject({
      pageViews: 100,
      linkClicks: 8,
      scrollDepth90: 12,
      evaluationOpened: 10,
      evaluationSucceeded: 2,
      qualificationSaved: 3,
      qualificationWhatsappClicks: 2,
    });
    expect(report.byPageType).toEqual([{ pageType: "landing", pageViews: 100 }]);
    expect(report.recommendations?.length).toBeGreaterThan(0);
  });
  it("desglosa CTA únicamente para pares permitidos y descarta valores arbitrarios", async () => {
    const queries: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      queries.push(query);
      return { ok: true, json: async () => ({ results: query.includes("AS unique_orders") ? [] : [
        ["ecosystem_cta_clicked", null, null, 0, "home_route", "home_hero", 6],
        ["ecosystem_cta_clicked", null, null, 0, "buyer@example.test", "home_hero", 900],
      ] }) };
    }));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-07-30"));
    expect(report.semanticCtaBreakdown).toEqual([{ cta: "home_route", source: "home_hero", clicks: 6 }]);
    expect(report.ecosystem?.ctaClicks).toBe(6);
    const ecosystemQuery = queries.find((query) => !query.includes("AS unique_orders"))!;
    expect(ecosystemQuery).toContain("JSONExtractString(properties, 'cta')");
    expect(ecosystemQuery).toContain("ecosystem_cta_clicked");
  });
  it("separa órdenes únicas de reintentos y eventos históricos sin ID en todos los productos", async () => {
    const queries: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      queries.push(query);
      return { ok: true, json: async () => ({ results: query.includes("AS eligible_checkouts") ? [[3, 2, 1]] : query.includes("AS unique_orders")
        ? [["ebook_purchase_confirmed", 8, 3, 2], ["class_purchase_confirmed", 2, 1, 0], ["workshop_purchase_confirmed", 1, 0, 1]]
        : [["ebook_page_view", "control", null, 0, 20], ["ebook_purchase_confirmed", "control", null, 0, 8]] }) };
    }));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(7, new Date("2026-11-12T12:00:00Z"));
    expect(report.purchasesByProduct).toEqual([
      { product: "ebook", eventCount: 8, uniqueOrders: 3, eventsWithoutOrderId: 2 },
      { product: "class", eventCount: 2, uniqueOrders: 1, eventsWithoutOrderId: 0 },
      { product: "workshop", eventCount: 1, uniqueOrders: 0, eventsWithoutOrderId: 1 },
    ]);
    expect(report.measurement).toEqual({ basis: "aggregate_events", sequentialFunnel: false,
      windowStart: "2026-11-05T12:00:00.000Z", windowEndExclusive: "2026-11-12T12:00:00.000Z" });
    expect(queries).toHaveLength(3);
    for (const query of queries) {
      expect(query).toContain("timestamp >= '2026-11-05T12:00:00.000Z'");
    }
    expect(queries.filter((query) => !query.includes("AS eligible_checkouts")).every((query) => query.includes("timestamp < '2026-11-12T12:00:00.000Z'"))).toBe(true);
    expect(queries.find((query) => query.includes("AS eligible_checkouts"))?.match(/timestamp <= '2026-11-12T12:00:00\.000Z' - INTERVAL 14 DAY/g)).toHaveLength(2);
    expect(queries.find((query) => query.includes("AS unique_orders"))).not.toContain("pricing_variant");
    expect(report.ebookOrderConversion).toEqual({ maturityDays: 14, eligibleCheckouts: 3, confirmedWithinWindow: 2, checkoutEventsWithoutOrderId: 1, conversionRate: 2 / 3 });
  });

  it("no presenta cobertura inventada si la segunda consulta falla", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      return query.includes("AS unique_orders") ? { ok: false, status: 503 } : { ok: true, json: async () => ({ results: query.includes("AS eligible_checkouts") ? [[0, 0, 0]] : [] }) };
    }));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-11-12"))).rejects.toThrow(/coverage.*503/);
  });

  it("rechaza conteos de cobertura inconsistentes", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => ({ ok: true,
      json: async () => ({ results: JSON.parse(options.body as string).query.query.includes("AS unique_orders")
        ? [["ebook_purchase_confirmed", 1, 2, 0]] : JSON.parse(options.body as string).query.query.includes("AS eligible_checkouts") ? [[0, 0, 0]] : [] }) })));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(7, new Date("2026-11-12"))).rejects.toThrow(/cobertura.*inválida/);
  });

  it("enlaza checkouts y compras por order_id en una cohorte con maduración completa", async () => {
    const queries: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      queries.push(query);
      return { ok: true, json: async () => ({ results: query.includes("AS eligible_checkouts") ? [[3, 2, 1]] : query.includes("AS unique_orders") ? [] : [] }) };
    }));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    const report = await fetchAnalyticsReport(30, new Date("2026-11-12T00:00:00Z"));
    const query = queries.find((item) => item.includes("AS eligible_checkouts"))!;
    expect(report.ebookOrderConversion).toEqual({ maturityDays: 14, eligibleCheckouts: 3, confirmedWithinWindow: 2, checkoutEventsWithoutOrderId: 1, conversionRate: 2 / 3 });
    expect(query).toContain("LEFT JOIN");
    expect(query).toContain("p.order_id = c.order_id");
    expect(query).toContain("p.purchased_at < c.checkout_at + INTERVAL 14 DAY");
    expect(query).toContain("uniqExactIf(c.order_id");
    expect(query).not.toContain("email");
  });

  it("falla en vez de devolver métricas de órdenes con forma inválida", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options: RequestInit) => {
      const query = JSON.parse(options.body as string).query.query as string;
      return { ok: true, json: async () => ({ results: query.includes("AS eligible_checkouts") ? [[1, 2, 0]] : [] }) };
    }));
    const { fetchAnalyticsReport } = await import("@/lib/posthog-analytics");
    await expect(fetchAnalyticsReport(30, new Date("2026-11-12"))).rejects.toThrow(/conversión de órdenes.*inválida/);
  });

});
