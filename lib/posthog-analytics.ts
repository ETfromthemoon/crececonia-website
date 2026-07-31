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

type HogQlRow = [event: string, variant: string | null, total: number];

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

  const variantTotals = new Map<
    string,
    { pageViews: number; checkoutsStarted: number; purchasesConfirmed: number }
  >();

  for (const row of rows) {
    const [event, variant, total] = row;
    const step = EVENT_TO_STEP[event];
    if (!step) continue;

    funnelTotals[step] += total;

    if (variant) {
      const entry = variantTotals.get(variant) ?? {
        pageViews: 0,
        checkoutsStarted: 0,
        purchasesConfirmed: 0,
      };
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

  const comboToggleRate =
    funnelTotals.page_view > 0 ? funnelTotals.combo_toggle / funnelTotals.page_view : 0;

  return {
    windowDays,
    funnel,
    byVariant,
    comboToggleRate,
    generatedAt: now.toISOString(),
  };
}
