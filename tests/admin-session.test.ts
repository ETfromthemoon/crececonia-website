import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

vi.mock("server-only", () => ({}));
import { ADMIN_SESSION_SECONDS, adminCookieName, createAdminSession, isAdminRequest, safeAdminDestination, validAdminCredential, validAdminSession } from "@/lib/admin-session";
import { POST as login } from "@/app/api/admin/session/login/route";
import { POST as logout } from "@/app/api/admin/session/logout/route";
import { loginLimited } from "@/lib/admin-login";
import { proxy } from "@/proxy";

const secret = "synthetic-secret-for-test-only";
const now = Date.parse("2026-11-12T12:00:00Z");
const origin = "https://example.test";
const request = (path: string, method = "GET", headers: Record<string, string> = {}, body?: string) => new Request(`${origin}${path}`, { method, headers, body });

beforeEach(() => { vi.stubEnv("ADMIN_SECRET", secret); });
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("admin session cryptography", () => {
  it("authenticates a signed token without embedding the credential", () => {
    const token = createAdminSession(now);
    expect(token).not.toContain(secret);
    expect(validAdminSession(token, now)).toBe(true);
    expect(createAdminSession(now)).not.toBe(token);
  });
  it("expires precisely at eight hours and rejects future issuance", () => {
    const token = createAdminSession(now);
    expect(validAdminSession(token, now + ADMIN_SESSION_SECONDS * 1000 - 1)).toBe(true);
    expect(validAdminSession(token, now + ADMIN_SESSION_SECONDS * 1000)).toBe(false);
    expect(validAdminSession(token, now - 1000)).toBe(false);
  });
  it("rejects tampering, malformed data, and a signed overlong lifetime", () => {
    const token = createAdminSession(now);
    expect(validAdminSession(`${token.slice(0, -1)}!`, now)).toBe(false);
    expect(validAdminSession("invalid", now)).toBe(false);
    const payload = `v1.${Math.floor(now / 1000)}.${Math.floor(now / 1000) + 999999}.` + "a".repeat(32);
    const signature = createHmac("sha256", secret).update(`crececonia-admin-session:v1:${payload}`).digest("base64url");
    expect(validAdminSession(`${payload}.${signature}`, now)).toBe(false);
  });
  it("fails closed without a secret and invalidates tokens on secret change", () => {
    const token = createAdminSession(now);
    vi.stubEnv("ADMIN_SECRET", "changed-secret");
    expect(validAdminSession(token, now)).toBe(false);
    vi.stubEnv("ADMIN_SECRET", "");
    expect(validAdminCredential("")).toBe(false);
    expect(validAdminSession(token, now)).toBe(false);
    expect(() => createAdminSession(now)).toThrow();
  });
});

describe("request authorization", () => {
  it("accepts session reads but requires same-origin for mutations", () => {
    const cookie = `${adminCookieName()}=${createAdminSession()}`;
    expect(isAdminRequest(request("/api/admin/launches", "GET", { cookie }))).toBe(true);
    expect(isAdminRequest(request("/api/admin/launches", "POST", { cookie }))).toBe(false);
    expect(isAdminRequest(request("/api/admin/launches", "POST", { cookie, origin: "https://evil.test" }))).toBe(false);
    expect(isAdminRequest(request("/api/admin/launches", "POST", { cookie, origin }))).toBe(true);
  });
  it("retains header auth for machine clients but rejects query credentials", () => {
    expect(isAdminRequest(request("/api/admin/launches", "POST", { "x-admin-key": secret }))).toBe(true);
    expect(isAdminRequest(request(`/api/admin/launches?key=${secret}`))).toBe(false);
    expect(isAdminRequest(request("/api/admin/launches", "GET", { "x-admin-key": "wrong" }))).toBe(false);
  });
});

describe("login and logout", () => {
  const loginRequest = (body: string, from = origin) => request("/api/admin/session/login", "POST", { origin: from, "content-type": "application/x-www-form-urlencoded" }, body);
  it("sets a production host-only secure cookie and a safe redirect", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await login(loginRequest(new URLSearchParams({ password: secret, next: "/admin/lanzamientos" }).toString()));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/admin/lanzamientos`);
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain("__Host-crece-admin=");
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).toContain("Path=/");
    expect(cookie).not.toContain(secret);
    expect(cookie).not.toMatch(/Domain=/i);
  });
  it("rejects cross-origin login before setting a cookie", async () => {
    const response = await login(loginRequest(`password=${secret}`, "https://evil.test"));
    expect(response.status).toBe(403);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("rejects opaque Origin rather than weakening CSRF for native forms", async () => {
    const response = await login(loginRequest(`password=${secret}`, "null"));
    expect(response.status).toBe(403);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("rejects bad credentials without echoing them", async () => {
    const response = await login(loginRequest("password=private-wrong-value"));
    expect(response.headers.get("location")).toBe(`${origin}/admin/login?error=1`);
    expect(response.headers.has("set-cookie")).toBe(false);
  });
  it("fails closed if unconfigured and bounds body size", async () => {
    expect((await login(loginRequest("password=" + "x".repeat(5000)))).status).toBe(400);
    vi.stubEnv("ADMIN_SECRET", "");
    expect((await login(loginRequest(`password=${secret}`))).status).toBe(503);
  });
  it("clears the cookie only on a same-origin logout", async () => {
    expect((await logout(request("/api/admin/session/logout", "POST"))).status).toBe(403);
    const response = await logout(request("/api/admin/session/logout", "POST", { origin }));
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("location")).toBe(`${origin}/admin/login`);
  });
  it("limits repeated invalid credentials on the current instance", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 10 * 60 * 1000);
    loginLimited();
    for (let i = 0; i < 20; i++) await login(loginRequest("password=wrong"));
    const response = await login(loginRequest(`password=${secret}`));
    expect(response.status).toBe(429);
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect((await login(loginRequest(`password=${secret}`))).status).toBe(303);
  });
});

describe("legacy links and destination safety", () => {
  it("preserves native same-origin form origins on admin pages", () => {
    for (const path of ["/admin/login", "/admin/ebook", "/api/admin/session/login"]) {
      const response = proxy(new NextRequest(`${origin}${path}`));
      expect(response.headers.get("referrer-policy")).toBe("same-origin");
    }
  });
  it.each(["https://evil.test", "//evil.test", "/admin/\\evil", "/admin/%2f%2fevil", "/admin/login", "/admin/logout", "/admin/ebook?next=https://evil.test", "/admin/../outside"])("rejects destination %s", (value) => {
    expect(safeAdminDestination(value)).toBe("/admin/ebook");
  });
  it("discards every query field on a bookmarked key URL", () => {
    const response = proxy(new NextRequest(`${origin}/admin/ebook?key=private&next=%2F%2Fevil.test`));
    expect(response.headers.get("location")).toBe(`${origin}/admin/login`);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-security-policy")).toContain("connect-src 'self'");
  });
});

describe("admin boundary wiring", () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? files(join(dir, item.name)) : [join(dir, item.name)]);
  }
  it("every admin data page and API has the common authorization guard", () => {
    for (const file of files("app/admin").filter((file) => file.endsWith("page.tsx") && !file.includes("login"))) {
      expect(readFileSync(file, "utf8"), file).toContain("await requireAdminSession()");
    }
    for (const file of files("app/api/admin").filter((file) => file.endsWith("route.ts") && !file.includes("session"))) {
      expect(readFileSync(file, "utf8"), file).toContain("isAdminRequest");
    }
  });
  it("browser admin components no longer receive or transmit the shared key", () => {
    for (const file of files("components/admin").filter((file) => file.endsWith(".tsx"))) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/adminKey|x-admin-key|ADMIN_SECRET/);
    }
  });
});
