import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createWorkshopAccessToken, verifyWorkshopAccessToken } from "@/lib/workshop-access";

describe("workshop signed room access", () => {
  beforeEach(() => {
    process.env.WORKSHOP_ACCESS_SECRET = "test-secret-that-is-not-used-in-production";
  });

  it.each([
    "workshop-1788819000000-abc123",
    "workshop-1788819000000-abc123-promo-METAQA-1234",
    "workshop-recovery-1788819000000-a1b2c3d4e5",
    "workshop-manual-1788819000000-a1b2c3d4",
  ])("acepta el formato legítimo %s", (orderId) => {
    const token = createWorkshopAccessToken(orderId);
    expect(token).not.toBeNull();
    expect(verifyWorkshopAccessToken(token ?? undefined)).toBe(orderId);
  });

  it("rechaza firmas alteradas y órdenes ajenas al workshop", () => {
    const token = createWorkshopAccessToken("workshop-1788819000000-abc123") ?? "";
    expect(verifyWorkshopAccessToken(`${token.slice(0, -1)}x`)).toBeNull();

    const unrelated = createWorkshopAccessToken("ebook-1788819000000-abc123");
    expect(verifyWorkshopAccessToken(unrelated ?? undefined)).toBeNull();
  });
});
