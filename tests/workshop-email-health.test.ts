import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getWorkshopEmailHealth } from "@/lib/workshop-email-health";

const events = [
  "email.sent", "email.delivered", "email.delivery_delayed", "email.bounced",
  "email.failed", "email.suppressed", "email.opened", "email.clicked",
];

describe("workshop Resend health", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_WEBHOOK_SECRET = "test-signing-secret";
    process.env.SITE_URL = "https://www.crececonia.cl";
  });

  afterEach(() => vi.unstubAllGlobals());

  it("exige dominio verificado y webhook productivo completo", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ name: "crececonia.cl", status: "verified" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ endpoint: "https://www.crececonia.cl/api/webhooks/resend", status: "enabled", events }] }) }));

    await expect(getWorkshopEmailHealth()).resolves.toMatchObject({ domainReady: true, webhookReady: true, missingWebhookEvents: [] });
  });

  it("no confunde un secreto presente con un webhook operativo", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ name: "crececonia.cl", status: "verified" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ endpoint: "https://www.crececonia.cl/api/webhooks/resend", status: "disabled", events: ["email.sent"] }] }) }));

    const health = await getWorkshopEmailHealth();
    expect(health.webhookFound).toBe(true);
    expect(health.webhookReady).toBe(false);
    expect(health.missingWebhookEvents).toContain("email.delivered");
  });
});
