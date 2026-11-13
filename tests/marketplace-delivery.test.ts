import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));

import { sendMarketplaceDelivery } from "@/lib/marketplace-delivery";
import { verifyMarketplaceDownloadToken } from "@/lib/marketplace-checkout";

describe("marketplace delivery retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
    vi.stubEnv("RESEND_API_KEY", "test");
    vi.stubEnv("MARKETPLACE_DOWNLOAD_SECRET", "x".repeat(32));
    vi.stubEnv("MARKETPLACE_SITE_URL", "https://www.crececonia.cl");
    send.mockReset().mockResolvedValue({ data: { id: "email-id" }, error: null });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

  it("sends a usable link even when the paid order is older than seven days", async () => {
    await sendMarketplaceDelivery({
      orderId: "c950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      itemId: "e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29",
      buyerEmail: "buyer@example.cl",
      title: "Libro",
      paidAt: "2026-10-01T12:00:00Z",
    });
    const html = send.mock.calls[0][0].html as string;
    const token = /token=([^"&]+)/.exec(html)?.[1];
    expect(token).toBeTruthy();
    expect(verifyMarketplaceDownloadToken(token!, "x".repeat(32))).toBe("e950e6f2-dc5c-4ce5-8ddd-e515b3d8fe29");
  });
});
