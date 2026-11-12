import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsAllowed, analyticsLinkDestination, analyticsSemanticCta, isPrivateAnalyticsUrl, sanitizeAnalyticsProperties, sanitizeAnalyticsUrl } from "@/lib/analytics-privacy";
import { ensureAnalytics } from "@/lib/analytics-client";
import { trackEvent } from "@/lib/analytics";
import { trackMetaEvent } from "@/lib/meta-pixel";
import MetaPixel from "@/components/MetaPixel";

const { sdk } = vi.hoisted(() => ({ sdk: { __loaded: false, init: vi.fn(), capture: vi.fn(), unregister: vi.fn(), set_config: vi.fn(), reloadFeatureFlags: vi.fn() } }));
vi.mock("posthog-js", () => ({ default: sdk }));
let href: string;
let marker: string | undefined;
let config: Record<string, any>;
beforeEach(() => {
  vi.clearAllMocks(); sdk.__loaded = false; href = "https://www.crececonia.cl/ebooks?utm_source=launch"; marker = undefined;
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "synthetic");
  vi.stubGlobal("window", { location: { get href() { return href; }, get pathname() { return new URL(href).pathname; }, get search() { return new URL(href).search; } }, fbq: vi.fn(), fetch: vi.fn() });
  vi.stubGlobal("document", { querySelector: () => marker ? { getAttribute: () => marker } : null });
  sdk.init.mockImplementation((_key, options) => { config = options; sdk.__loaded = true; options.loaded(sdk); });
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("analytics privacy boundary", () => {
  it("redacts URLs and nested attribution without changing the original", () => {
    const raw = "https://www.crececonia.cl/ebooks?token=secret&key=secret&t=secret&email=a%40example.test&utm_source=news&utm_campaign=nov#secret";
    const output = sanitizeAnalyticsProperties({ $current_url: raw, $referrer: raw, $set_once: { $initial_current_url: raw }, $elements: [{ attr__href: raw }], email: "a@example.test", token: "secret", route: "/ebooks" });
    expect(JSON.stringify(output)).not.toMatch(/secret|a@example|attr__href/);
    expect(output.$current_url).toBe("https://www.crececonia.cl/ebooks?utm_source=news&utm_campaign=nov");
    expect(output.route).toBe("/ebooks");
    expect(raw).toContain("token=secret");
  });
  it("rejects contact URLs and removes credentials and fragments", () => {
    expect(sanitizeAnalyticsUrl("mailto:buyer@example.test")).toBeUndefined();
    expect(sanitizeAnalyticsUrl("https://user:password@example.test/a?TOKEN=secret&utm_source=buyer%40example.test#secret")).toBe("https://example.test/a");
    expect(analyticsLinkDestination("mailto:buyer@example.test?subject=secret", href)).toEqual({ destination_type: "contact", contact_channel: "email" });
    expect(analyticsLinkDestination("tel:+56912345678", href)).toEqual({ destination_type: "contact", contact_channel: "phone" });
    expect(analyticsLinkDestination("/api/ebook/download?token=secret", href).destination_path).toBe("/api/ebook/download");
  });
  it("accepts only reviewed static semantic CTA and source labels", () => {
    expect(analyticsSemanticCta({ dataset: { analyticsCta: "route_selector", analyticsSource: "ia_selector" } } as unknown as HTMLElement)).toEqual({ cta: "route_selector", source: "ia_selector" });
    expect(analyticsSemanticCta({ dataset: { analyticsCta: "route_selector", analyticsSource: "buyer@example.test" } } as unknown as HTMLElement)).toBeUndefined();
    expect(analyticsSemanticCta({ dataset: { analyticsCta: "button text", analyticsSource: "ia_selector" } } as unknown as HTMLElement)).toBeUndefined();
    expect(analyticsSemanticCta({ dataset: { analyticsCta: "route_selector", analyticsSource: "home_hero" } } as unknown as HTMLElement)).toBeUndefined();
    expect(analyticsSemanticCta({ dataset: { analyticsCta: "constructor", analyticsSource: "prototype" } } as unknown as HTMLElement)).toBeUndefined();
  });
  it.each(["/admin", "/admin/ebook", "/solicitar-llamada?t=secret", "/ebook/book/success?token=secret", "/lanzamientos/private", "/ebook/book?preview=secret", "/anything?%74oken=secret"])("does not initialize or capture on %s", (path) => {
    href = new URL(path, href).href;
    ensureAnalytics(); trackEvent("should_not_send");
    expect(sdk.init).not.toHaveBeenCalled(); expect(sdk.capture).not.toHaveBeenCalled();
  });
  it("requires the matching published marker for launches, including cookie previews", () => {
    href = "https://www.crececonia.cl/lanzamientos/live";
    expect(analyticsAllowed()).toBe(false);
    marker = "/lanzamientos/other"; expect(analyticsAllowed()).toBe(false);
    marker = "/lanzamientos/live"; expect(analyticsAllowed()).toBe(true);
    href += "?key=secret"; expect(analyticsAllowed()).toBe(false);
    expect(isPrivateAnalyticsUrl("/administer")).toBe(false);
  });
  it("sanitizes SDK output and drops it after public to private navigation", () => {
    ensureAnalytics();
    const event = { event: "$pageview", properties: { token: "untrusted-event-token", nested: { token: "private-token" }, $current_url: "https://example.test/a?token=secret&utm_medium=email" } };
    expect(config.before_send(event).properties.$current_url).toBe("https://example.test/a?utm_medium=email");
    expect(config.before_send(event).properties.token).toBe("synthetic");
    expect(config.before_send(event).properties.nested).toEqual({});
    href = "https://www.crececonia.cl/admin/ebook";
    expect(config.before_send(event)).toBeNull();
    trackEvent("private"); expect(sdk.capture).not.toHaveBeenCalled();
    href = "https://www.crececonia.cl/lanzamientos/private";
    expect(config.before_send(event)).toBeNull();
  });
  it("disables opaque capture channels and clears old flag payload caches before flag loading", () => {
    ensureAnalytics();
    expect(config).toMatchObject({ autocapture: false, capture_dead_clicks: false, disable_session_recording: true, disable_external_dependency_loading: true, capture_exceptions: false, capture_performance: false, save_referrer: false, save_campaign_params: false });
    expect(config).not.toHaveProperty("advanced_disable_flags");
    expect(sdk.unregister).toHaveBeenCalledWith("$initial_person_info");
    expect(sdk.unregister).toHaveBeenCalledWith("$stored_person_properties");
    expect(sdk.unregister.mock.invocationCallOrder.at(-1)).toBeLessThan(sdk.reloadFeatureFlags.mock.invocationCallOrder[0]);
  });
  it("preserves named product events and allowed campaign attribution", () => {
    trackEvent("qualification_saved", { service: "mentoria" });
    expect(sdk.capture).toHaveBeenCalledWith("qualification_saved", expect.objectContaining({ service: "mentoria", route: "/ebooks", utm_source: "launch" }));
  });
  it.each(["/ebooks", "/admin", "/lanzamientos/private", "/ebook/book/success?token=secret"])("never loads or invokes Meta on %s even if an old fbq is present", (path) => {
    href = new URL(path, href).href;
    expect(MetaPixel()).toBeNull();
    trackMetaEvent("Purchase", { value: 1000 });
    expect((window as unknown as { fbq: ReturnType<typeof vi.fn> }).fbq).not.toHaveBeenCalled();
    expect(window.fetch).not.toHaveBeenCalled();
  });
});
