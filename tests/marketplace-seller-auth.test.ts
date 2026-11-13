import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const queryDatabase = vi.hoisted(() => vi.fn());
vi.mock("@/lib/database", () => ({ queryDatabase }));

import { consumeSellerLogin, createSellerSession, normalizeSellerEmail, requestSellerLogin, sellerCookieName, sellerIdentityFromRequest, sellerMutationAllowed, verifySellerSession } from "@/lib/marketplace-seller-auth";
import { POST as verifyLogin } from "@/app/api/marketplace/seller/verify/route";

const identity = "123e4567-e89b-12d3-a456-426614174000";
const origin = "https://example.test";

beforeEach(() => { vi.stubEnv("ADMIN_SECRET", "test-only-long-admin-secret-value-1234567890"); queryDatabase.mockReset(); });
afterEach(() => { vi.unstubAllEnvs(); });

describe("seller access", () => {
  it("normalizes email and rejects malformed addresses", () => {
    expect(normalizeSellerEmail("  A@Example.cl  ")).toBe("a@example.cl");
    expect(normalizeSellerEmail("a@invalid")).toBeNull();
    expect(normalizeSellerEmail("a@b.cl\nBcc: x@y.cl")).toBeNull();
  });

  it("signs an expiring identity session and requires exact origin for writes", () => {
    const now = Date.parse("2026-11-13T12:00:00Z");
    const token = createSellerSession(identity, now);
    expect(verifySellerSession(token, now)).toBe(identity);
    expect(verifySellerSession(token, now + 8 * 60 * 60 * 1000)).toBeNull();
    expect(verifySellerSession(token.slice(0, -1) + "!", now)).toBeNull();
    const cookie = `${sellerCookieName()}=${createSellerSession(identity)}`;
    expect(sellerIdentityFromRequest(new Request(`${origin}/api/marketplace/seller/dashboard`, { headers: { cookie } }))).toBe(identity);
    expect(sellerMutationAllowed(new Request(`${origin}/api/marketplace/seller/books`, { method: "POST", headers: { cookie, origin } }))).toBe(true);
    expect(sellerMutationAllowed(new Request(`${origin}/api/marketplace/seller/books`, { method: "POST", headers: { cookie, origin: "https://evil.test" } }))).toBe(false);
  });

  it("limits login requests, hashes challenges, and consumes each token atomically", async () => {
    const email = "autor@example.cl";
    queryDatabase.mockResolvedValueOnce([{ attempts: 1 }]).mockResolvedValueOnce([{ attempts: 1 }]).mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ email }]).mockResolvedValueOnce([{ id: identity }]).mockResolvedValueOnce([]);
    const token = await requestSellerLogin(email, "192.0.2.1");
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(queryDatabase.mock.calls[2][1][1]).not.toBe(token);
    expect(await consumeSellerLogin(token!)).toBe(identity);
    expect(await consumeSellerLogin(token!)).toBeNull();
    expect(queryDatabase.mock.calls[3][0]).toContain("consumed_at is null");
    queryDatabase.mockReset().mockResolvedValue([]);
    expect(await requestSellerLogin(email, "192.0.2.1")).toBeNull();
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });

  it("never sets an access cookie for an invalid, replayed, or cross-site challenge", async () => {
    const token = "a".repeat(43);
    const makeRequest = (from: string) => new Request(`${origin}/api/marketplace/seller/verify`, {
      method: "POST", headers: { origin: from, "content-type": "application/json" }, body: JSON.stringify({ token }),
    });
    queryDatabase.mockResolvedValueOnce([{ email: "autor@example.cl" }]).mockResolvedValueOnce([{ id: identity }]).mockResolvedValueOnce([]);
    expect((await verifyLogin(makeRequest("https://evil.test"))).status).toBe(403);
    const success = await verifyLogin(makeRequest(origin));
    expect(success.status).toBe(200);
    expect(success.headers.get("set-cookie")).toMatch(/HttpOnly.*SameSite=strict/i);
    const replay = await verifyLogin(makeRequest(origin));
    expect(replay.status).toBe(400);
    expect(replay.headers.has("set-cookie")).toBe(false);
  });
});
