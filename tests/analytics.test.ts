import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("trackEbookEvent", () => {
  const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
    vi.doUnmock("posthog-js");
  });

  it("no lanza si posthog-js no está inicializado (sin key configurada)", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { trackEbookEvent } = await import("@/lib/analytics");
    expect(() => trackEbookEvent("ebook_page_view", { resource: "ebook:test" })).not.toThrow();
  });

  it("llama a posthog.capture cuando el cliente está inicializado", async () => {
    const captureMock = vi.fn();
    vi.doMock("posthog-js", () => ({
      default: { __loaded: true, capture: captureMock },
    }));
    const { trackEbookEvent } = await import("@/lib/analytics");
    trackEbookEvent("ebook_page_view", { resource: "ebook:test" });
    expect(captureMock).toHaveBeenCalledWith("ebook_page_view", { resource: "ebook:test" });
  });
});
