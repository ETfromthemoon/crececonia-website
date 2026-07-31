import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("captureServerEvent", () => {
  const originalKey = process.env.POSTHOG_SERVER_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.POSTHOG_SERVER_KEY = originalKey;
    vi.doUnmock("posthog-node");
  });

  it("no lanza si POSTHOG_SERVER_KEY no está configurada", async () => {
    delete process.env.POSTHOG_SERVER_KEY;
    const { captureServerEvent } = await import("@/lib/posthog-server");
    await expect(
      captureServerEvent("ebook_checkout_started", "test@example.com", { resource: "ebook:test" })
    ).resolves.toBeUndefined();
  });

  it("llama a capture y shutdown cuando la key está configurada", async () => {
    process.env.POSTHOG_SERVER_KEY = "phc_test_key";
    const captureMock = vi.fn();
    const shutdownMock = vi.fn().mockResolvedValue(undefined);
    vi.doMock("posthog-node", () => ({
      PostHog: vi.fn(function PostHogMock() {
        return { capture: captureMock, shutdown: shutdownMock };
      }),
    }));
    const { captureServerEvent } = await import("@/lib/posthog-server");
    await captureServerEvent("ebook_checkout_started", "test@example.com", {
      resource: "ebook:test",
    });
    expect(captureMock).toHaveBeenCalledWith({
      distinctId: "test@example.com",
      event: "ebook_checkout_started",
      properties: { resource: "ebook:test" },
    });
    expect(shutdownMock).toHaveBeenCalled();
  });
});
