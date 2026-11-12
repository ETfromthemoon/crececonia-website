import { afterEach, expect, it, vi } from "vitest";

// Model React effect dependency comparison and cleanup without a browser server.
const state = vi.hoisted(() => ({
  search: "token=private",
  deps: undefined as readonly unknown[] | undefined,
  cleanup: undefined as (() => void) | undefined,
  track: vi.fn(),
}));
vi.mock("react", () => ({
  useRef: (current: unknown) => ({ current }),
  useEffect: (effect: () => (() => void) | undefined, deps: readonly unknown[]) => {
    if (state.deps && deps.every((value, index) => Object.is(value, state.deps![index]))) return;
    state.cleanup?.();
    state.deps = deps;
    state.cleanup = effect();
  },
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/ebooks",
  useSearchParams: () => new URLSearchParams(state.search),
}));
vi.mock("@/lib/analytics", () => ({ getPageType: () => "ebooks", trackEvent: state.track }));
import PostHogEcosystemTracker from "@/components/PostHogEcosystemTracker";

afterEach(() => {
  state.cleanup?.(); state.cleanup = undefined; state.deps = undefined;
  state.search = "token=private"; vi.clearAllMocks(); vi.unstubAllGlobals();
});

it("starts and cleans up tracking on query-only private/public navigation", () => {
  const scroll = new Set<() => void>();
  const clicks = new Set<() => void>();
  const disconnect = vi.fn();
  vi.stubGlobal("window", {
    location: { get href() { return `https://example.test/ebooks${state.search ? `?${state.search}` : ""}`; } },
    innerHeight: 100, scrollY: 500,
    addEventListener: (_: string, listener: () => void) => scroll.add(listener),
    removeEventListener: (_: string, listener: () => void) => scroll.delete(listener),
  });
  vi.stubGlobal("document", {
    referrer: "", querySelector: () => null, querySelectorAll: () => [],
    documentElement: { scrollHeight: 1100 },
    addEventListener: (_: string, listener: () => void) => clicks.add(listener),
    removeEventListener: (_: string, listener: () => void) => clicks.delete(listener),
  });
  vi.stubGlobal("IntersectionObserver", class { disconnect = disconnect; observe() {} });

  PostHogEcosystemTracker();
  expect(state.track).not.toHaveBeenCalled();
  expect(scroll.size).toBe(0); expect(clicks.size).toBe(0);

  state.search = "";
  PostHogEcosystemTracker();
  expect(state.track).toHaveBeenCalledWith("ecosystem_page_view", expect.objectContaining({ route: "/ebooks" }));
  expect(state.track).toHaveBeenCalledWith("ecosystem_scroll_depth", expect.objectContaining({ depth_percent: 50 }));
  expect(scroll.size).toBe(1); expect(clicks.size).toBe(1);
  const count = state.track.mock.calls.length;
  PostHogEcosystemTracker();
  expect(state.track).toHaveBeenCalledTimes(count);

  state.search = "token=private";
  PostHogEcosystemTracker();
  expect(disconnect).toHaveBeenCalledTimes(1);
  expect(scroll.size).toBe(0); expect(clicks.size).toBe(0);
  expect(state.track).toHaveBeenCalledTimes(count);

  state.search = "utm_source=launch";
  PostHogEcosystemTracker();
  expect(scroll.size).toBe(1); expect(clicks.size).toBe(1);
  expect(state.track.mock.calls.filter(([event]) => event === "ecosystem_page_view")).toHaveLength(2);
});
