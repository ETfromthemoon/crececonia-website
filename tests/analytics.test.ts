import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("trackEbookEvent", () => {
  const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
    vi.doUnmock("posthog-js");
    vi.unstubAllGlobals();
  });

  it("no lanza si posthog-js no está inicializado (sin key configurada)", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { trackEbookEvent } = await import("@/lib/analytics");
    expect(() => trackEbookEvent("ebook_page_view", { resource: "ebook:test" })).not.toThrow();
  });

  it("llama a posthog.capture cuando el cliente está inicializado", async () => {
    vi.stubGlobal("window", { location: new URL("https://www.crececonia.cl/ebooks?utm_source=instagram&utm_campaign=lanzamiento") });
    const captureMock = vi.fn();
    vi.doMock("posthog-js", () => ({
      default: { __loaded: true, capture: captureMock },
    }));
    const { trackEbookEvent } = await import("@/lib/analytics");
    trackEbookEvent("ebook_page_view", { resource: "ebook:test" });
    expect(captureMock).toHaveBeenCalledWith("ebook_page_view", expect.objectContaining({
      resource: "ebook:test",
      route: "/ebooks",
      page_type: "ebooks",
      utm_source: "instagram",
      utm_campaign: "lanzamiento",
    }));
  });

  it("entrega al checkout sólo la allowlist UTM actual, sin identificadores de click o datos de contacto", async () => {
    vi.stubGlobal("window", { location: new URL("https://www.crececonia.cl/ebooks?utm_source=instagram&utm_term=ia&utm_campaign=buyer%40example.com&fbclid=click-123") });
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => true } }));
    const { getEbookAnalyticsAttribution } = await import("@/lib/analytics");
    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "instagram", utm_term: "ia" });
  });

  it("conserva sólo la atribución UTM saneada desde la landing hasta el checkout y reemplaza campañas nuevas", async () => {
    let href = "https://www.crececonia.cl/?utm_source=instagram&utm_campaign=lanzamiento&utm_term=buyer%40example.com&gclid=click-123";
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    vi.stubGlobal("window", {
      get location() { return new URL(href); },
      sessionStorage: storage,
    });
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => true } }));
    const { getEbookAnalyticsAttribution } = await import("@/lib/analytics");

    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "instagram", utm_campaign: "lanzamiento" });
    expect([...values.values()].join(" ")).not.toMatch(/email|click|gclid|buyer/i);

    href = "https://www.crececonia.cl/ebook/de-cero-a-claude-en-una-semana";
    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "instagram", utm_campaign: "lanzamiento" });

    href += "?utm_source=tiktok";
    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "tiktok" });
    href = "https://www.crececonia.cl/ebook/de-cero-a-claude-en-una-semana/checkout";
    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "tiktok" });
  });

  it("continúa sin atribución guardada cuando sessionStorage falla", async () => {
    vi.stubGlobal("window", {
      location: new URL("https://www.crececonia.cl/ebooks?utm_source=instagram"),
      sessionStorage: { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } },
    });
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => true } }));
    const { getEbookAnalyticsAttribution } = await import("@/lib/analytics");
    expect(getEbookAnalyticsAttribution()).toEqual({ utm_source: "instagram" });
  });

  it("no lee ni persiste UTM en rutas donde analyticsAllowed es false", async () => {
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      location: new URL("https://www.crececonia.cl/admin/ebook?utm_source=instagram"),
      sessionStorage: { getItem, setItem },
    });
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => true } }));
    const { getEbookAnalyticsAttribution } = await import("@/lib/analytics");
    expect(getEbookAnalyticsAttribution()).toEqual({});
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("no lee ni persiste UTM cuando el SDK informa que la captura está desactivada", async () => {
    const getItem = vi.fn(() => null);
    const setItem = vi.fn();
    vi.stubGlobal("window", {
      location: new URL("https://www.crececonia.cl/ebooks?utm_source=instagram"),
      sessionStorage: { getItem, setItem },
    });
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => false } }));
    const { getEbookAnalyticsAttribution } = await import("@/lib/analytics");
    expect(getEbookAnalyticsAttribution()).toEqual({});
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("no entrega el distinct ID del checkout cuando la captura está desactivada", async () => {
    vi.stubGlobal("window", { location: new URL("https://www.crececonia.cl/ebooks") });
    const getDistinctId = vi.fn(() => "anon-1");
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => false, get_distinct_id: getDistinctId } }));
    const { getEbookAnalyticsDistinctId } = await import("@/lib/analytics");
    expect(getEbookAnalyticsDistinctId()).toBeUndefined();
    expect(getDistinctId).not.toHaveBeenCalled();
  });

  it("entrega el UUIDv7 anónimo del SDK cuando la captura está permitida", async () => {
    vi.stubGlobal("window", { location: new URL("https://www.crececonia.cl/ebooks") });
    const anonymousId = "019525c0-0000-7000-8000-000000000001";
    const getDistinctId = vi.fn(() => anonymousId);
    vi.doMock("posthog-js", () => ({ default: { __loaded: true, is_capturing: () => true, get_distinct_id: getDistinctId } }));
    const { getEbookAnalyticsDistinctId } = await import("@/lib/analytics");
    expect(getEbookAnalyticsDistinctId()).toBe(anonymousId);
    expect(getDistinctId).toHaveBeenCalledOnce();
  });
});
