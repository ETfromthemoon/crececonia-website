import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase: database }));

import { allowMarketplaceCheckoutAttempt, marketplaceClientIp } from "@/lib/marketplace-checkout-rate-limit";

describe("límite distribuido de checkout", () => {
  beforeEach(() => {
    vi.stubEnv("MARKETPLACE_DOWNLOAD_SECRET", "x".repeat(32));
    database.mockReset().mockResolvedValue([{ allowed: true }]);
  });
  afterEach(() => vi.unstubAllEnvs());

  const request = (ip?: string) => new Request("https://www.crececonia.cl/api/marketplace/checkout", {
    headers: ip ? { "x-vercel-forwarded-for": ip } : {},
  });

  it("usa una IP válida de Vercel y nunca persiste IP ni correo en claro", async () => {
    expect(marketplaceClientIp(request("203.0.113.7"))).toBe("203.0.113.7");
    expect(await allowMarketplaceCheckoutAttempt(request("203.0.113.7"), "buyer@example.cl", "book-1", true)).toBe(true);
    const [sql, values] = database.mock.calls[0];
    expect(sql).toContain("on conflict (key_hash) do update");
    expect(sql).toContain("marketplace_checkout_limits");
    expect(values).toEqual([expect.stringMatching(/^[a-f0-9]{64}$/), expect.stringMatching(/^[a-f0-9]{64}$/), 900]);
    expect(JSON.stringify(values)).not.toContain("buyer@example.cl");
    expect(JSON.stringify(values)).not.toContain("203.0.113.7");
  });

  it("bloquea en vivo sin IP de Vercel y permite contador de correo en sandbox", async () => {
    expect(marketplaceClientIp(request("not-an-ip"))).toBeNull();
    expect(await allowMarketplaceCheckoutAttempt(request(), "buyer@example.cl", "book-1", true)).toBe(false);
    expect(database).not.toHaveBeenCalled();
    expect(await allowMarketplaceCheckoutAttempt(request(), "buyer@example.cl", "book-1", false)).toBe(true);
    expect(database.mock.calls[0][1][0]).toBeNull();
  });

  it("niega cuando el contador atómico supera su máximo", async () => {
    database.mockResolvedValueOnce([{ allowed: false }]);
    expect(await allowMarketplaceCheckoutAttempt(request("203.0.113.7"), "buyer@example.cl", "book-1", true)).toBe(false);
  });
});
