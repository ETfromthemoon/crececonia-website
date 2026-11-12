import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createChallenge: vi.fn(), reserveRequest: vi.fn(), consumeChallenge: vi.fn(), getSessionEmail: vi.fn(), ownsResource: vi.fn(), revokeSession: vi.fn(),
  sendLibraryAccess: vi.fn(), downloadPrivateObject: vi.fn(), cookieValue: "session-secret",
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/ebook-library-repository", () => ({
  createChallenge: mocks.createChallenge, reserveRequest: mocks.reserveRequest,
  consumeChallenge: mocks.consumeChallenge, getSessionEmail: mocks.getSessionEmail,
  ownsResource: mocks.ownsResource, revokeSession: mocks.revokeSession,
}));
vi.mock("@/lib/ebook-library-email", () => ({ sendLibraryAccess: mocks.sendLibraryAccess }));
vi.mock("@/lib/private-storage", () => ({ downloadPrivateObject: mocks.downloadPrivateObject }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: mocks.cookieValue }) }) }));

import { POST as requestAccess } from "@/app/api/biblioteca/access/request/route";
import { POST as consumeAccess } from "@/app/api/biblioteca/access/consume/route";
import { GET as download } from "@/app/api/biblioteca/download/route";
import { POST as logout } from "@/app/api/biblioteca/logout/route";
import { libraryRateKey } from "@/lib/ebook-library-config";

const origin = "https://www.crececonia.cl";
const enabledEnv = { EBOOK_LIBRARY_ENABLED: process.env.EBOOK_LIBRARY_ENABLED, EBOOK_LIBRARY_RATE_SECRET: process.env.EBOOK_LIBRARY_RATE_SECRET, RESEND_API_KEY: process.env.RESEND_API_KEY, RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL, NODE_ENV: process.env.NODE_ENV };
const request = (path: string, init: RequestInit = {}) => new Request(`${origin}${path}`, init);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.EBOOK_LIBRARY_ENABLED = "true";
  process.env.EBOOK_LIBRARY_RATE_SECRET = "s".repeat(40);
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.RESEND_FROM_EMAIL = "CrececonIA <test@example.com>";
  mocks.cookieValue = "session-secret";
  mocks.reserveRequest.mockResolvedValue(true);
  mocks.createChallenge.mockResolvedValue(undefined);
  mocks.sendLibraryAccess.mockResolvedValue(undefined);
  mocks.consumeChallenge.mockResolvedValue(true);
  mocks.getSessionEmail.mockResolvedValue("buyer@example.com");
  mocks.ownsResource.mockResolvedValue(true);
  mocks.revokeSession.mockResolvedValue(undefined);
  mocks.downloadPrivateObject.mockResolvedValue({ data: new Blob(["%PDF-test"]), error: null });
});

afterEach(() => {
  for (const [key, value] of Object.entries(enabledEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

describe("API biblioteca personal", () => {
  it("rechaza solicitudes cuando la función está desactivada y no procesa el email", async () => {
    process.env.EBOOK_LIBRARY_ENABLED = "false";
    const response = await requestAccess(request("/api/biblioteca/access/request", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ email: "buyer@example.com" }) }));
    expect(response.status).toBe(503);
    expect(mocks.sendLibraryAccess).not.toHaveBeenCalled();
  });

  it("valida el origen canónico y aplica respuesta genérica al límite de frecuencia", async () => {
    const crossSite = await requestAccess(request("/api/biblioteca/access/request", { method: "POST", headers: { origin: "https://attacker.test", "content-type": "application/json" }, body: JSON.stringify({ email: "buyer@example.com" }) }));
    expect(crossSite.status).toBe(403);
    mocks.reserveRequest.mockResolvedValueOnce(false);
    const limited = await requestAccess(request("/api/biblioteca/access/request", { method: "POST", headers: { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.1" }, body: JSON.stringify({ email: "buyer@example.com" }) }));
    expect(limited.status).toBe(200);
    expect(await limited.json()).toEqual({ ok: true, message: "Si podemos procesar la solicitud, recibirás un correo con los siguientes pasos." });
    expect(mocks.sendLibraryAccess).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos mayores a 2 KiB antes de crear desafíos o enviar correo", async () => {
    const response = await requestAccess(request("/api/biblioteca/access/request", { method: "POST", headers: { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8" }, body: JSON.stringify({ email: `${"a".repeat(2_100)}@example.com` }) }));
    expect(response.status).toBe(413);
    expect(mocks.reserveRequest).not.toHaveBeenCalled();
    expect(mocks.createChallenge).not.toHaveBeenCalled();
    expect(mocks.sendLibraryAccess).not.toHaveBeenCalled();
  });

  it("envía acceso con enlace al dominio canónico y no filtra si hay compra", async () => {
    const response = await requestAccess(request("/api/biblioteca/access/request", { method: "POST", headers: { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.1" }, body: JSON.stringify({ email: " Buyer@Example.com " }) }));
    expect(response.status).toBe(200);
    expect(mocks.reserveRequest).toHaveBeenCalledOnce();
    expect(mocks.createChallenge).toHaveBeenCalledOnce();
    expect(mocks.sendLibraryAccess).toHaveBeenCalledOnce();
    expect(mocks.sendLibraryAccess.mock.calls[0][0]).toBe("buyer@example.com");
    const link = new URL(mocks.sendLibraryAccess.mock.calls[0][1]);
    expect(link.origin).toBe(origin);
    expect(link.pathname).toBe("/biblioteca/confirmar");
    expect(link.hash).toMatch(/^#token=/);
    expect(mocks.sendLibraryAccess.mock.calls[0][1]).not.toContain("attacker");
  });

  it("rate-limita el consumo por IP antes de consultar el reto", async () => {
    mocks.reserveRequest.mockResolvedValueOnce(false);
    const response = await consumeAccess(request("/api/biblioteca/access/consume", { method: "POST", headers: { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.1" }, body: JSON.stringify({ token: "one-time-token" }) }));
    expect(response.status).toBe(400);
    expect(mocks.reserveRequest).toHaveBeenCalledWith(await libraryRateKey("email", "consume:one-time-token"), await libraryRateKey("ip", "203.0.113.8"));
    expect(mocks.consumeChallenge).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos de consumo mayores a 2 KiB antes de consultar el reto", async () => {
    const response = await consumeAccess(request("/api/biblioteca/access/consume", { method: "POST", headers: { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8" }, body: JSON.stringify({ token: "x".repeat(2_100) }) }));
    expect(response.status).toBe(413);
    expect(mocks.reserveRequest).not.toHaveBeenCalled();
    expect(mocks.consumeChallenge).not.toHaveBeenCalled();
  });

  it("consume un reto una sola vez y fija cookie de sesión HttpOnly", async () => {
    const headers = { origin, "content-type": "application/json", "x-vercel-forwarded-for": "203.0.113.8", "x-forwarded-for": "198.51.100.1" };
    const response = await consumeAccess(request("/api/biblioteca/access/consume", { method: "POST", headers, body: JSON.stringify({ token: "one-time-token" }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, redirect: "/biblioteca" });
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    mocks.consumeChallenge.mockResolvedValueOnce(false);
    const replay = await consumeAccess(request("/api/biblioteca/access/consume", { method: "POST", headers, body: JSON.stringify({ token: "one-time-token" }) }));
    expect(replay.status).toBe(400);
  });

  it("autoriza descarga sólo cuando la sesión posee el recurso", async () => {
    const response = await download(request("/api/biblioteca/download?resource=ebook:de-cero-a-claude-en-una-semana&format=a4"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(mocks.ownsResource).toHaveBeenCalledWith("buyer@example.com", "ebook:de-cero-a-claude-en-una-semana");
    mocks.ownsResource.mockResolvedValueOnce(false);
    const denied = await download(request("/api/biblioteca/download?resource=ebook:de-cero-a-claude-en-una-semana&format=a4"));
    expect(denied.status).toBe(404);
    expect(mocks.downloadPrivateObject).toHaveBeenCalledOnce();
  });

  it("revoca sesión y elimina cookie al cerrar sesión", async () => {
    const response = await logout(request("/api/biblioteca/logout", { method: "POST", headers: { origin } }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/biblioteca/acceso`);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(mocks.revokeSession).toHaveBeenCalledOnce();
  });
});
