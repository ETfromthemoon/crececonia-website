import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("uses the real SDK to clean caches before transport and resume flags after query-only privacy transitions", async () => {
  vi.useFakeTimers();
  const requests: Array<{ url: string; body: string; cleaned: boolean }> = [];
  let cleaned = false;
  const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
    requests.push({ url: String(url), body: String(options?.body ?? ""), cleaned });
    return new Response(JSON.stringify(String(url).includes("/flags/")
      ? { featureFlags: { "ebook-pricing-variant": "variant" }, featureFlagPayloads: {} }
      : { hasFeatureFlags: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);
  // Import before adding a DOM stand-in: exercise real SDK transports in Node,
  // without needing or pretending to test a browser DOM implementation here.
  const { default: client } = await import("posthog-js");
  const { analyticsConfig, syncAnalyticsPrivacy } = await import("@/lib/analytics-client");
  let href = "https://www.crececonia.cl/ebooks";
  vi.stubGlobal("window", { location: { get href() { return href; } } });
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "synthetic-contract-test");
  const config = analyticsConfig();
  client.init("synthetic-contract-test", {
    ...config,
    api_host: "https://analytics.example.test",
    persistence: "memory",
    request_batching: false,
    disable_compression: true,
    capture_pageview: false,
    capture_pageleave: false,
    remote_config_refresh_interval_ms: 0,
    loaded: (sdk) => {
      sdk.register({ $initial_referrer_info: { referrer: "https://example.test/?token=synthetic-secret" }, $stored_person_properties: { email: "private@example.test" } });
      config.loaded!(sdk);
      cleaned = true;
    },
  });
  await vi.advanceTimersByTimeAsync(50);
  expect(requests.some((request) => request.url.includes("/flags/"))).toBe(true);
  expect(requests.every((request) => request.cleaned)).toBe(true);
  expect(JSON.stringify(requests)).not.toMatch(/synthetic-secret|private@example/);
  expect(client.getFeatureFlag("ebook-pricing-variant", { send_event: false })).toBe("variant");
  const beforePrivate = requests.length;
  href += "?token=synthetic-secret";
  syncAnalyticsPrivacy();
  client.reloadFeatureFlags();
  client.capture("private-event");
  await vi.advanceTimersByTimeAsync(50);
  expect(requests).toHaveLength(beforePrivate);
  href = "https://www.crececonia.cl/ebooks?utm_source=public";
  syncAnalyticsPrivacy();
  await vi.advanceTimersByTimeAsync(50);
  expect(requests.filter((request) => request.url.includes("/flags/")).length).toBeGreaterThan(1);
  expect(client.getFeatureFlag("ebook-pricing-variant", { send_event: false })).toBe("variant");
  client.set_config({ advanced_disable_flags: true });
});
