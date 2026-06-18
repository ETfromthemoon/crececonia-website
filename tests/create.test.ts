import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockear getCurrentPrice directamente evita depender de la cadena de Supabase
vi.mock("@/lib/ebook-pricing", () => ({
  getCurrentPrice: vi.fn().mockResolvedValue({
    price: 10800,
    tier: "super-early",
    remaining: 7,
    originalPrice: 27000,
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/flow/create/route";

function postJson(body: unknown) {
  return new Request("https://test.com/api/flow/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/flow/create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 cuando no se pasa email", async () => {
    const res = await POST(postJson({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it("400 para email sin formato válido", async () => {
    const res = await POST(postJson({ email: "no-es-un-email" }));
    expect(res.status).toBe(400);
  });

  it("400 para body no-JSON", async () => {
    const res = await POST(
      new Request("https://test.com/api/flow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "esto no es json",
      })
    );
    expect(res.status).toBe(400);
  });

  it("400 para email con espacios", async () => {
    const res = await POST(postJson({ email: "user @test.com" }));
    expect(res.status).toBe(400);
  });

  it("502 cuando Flow API devuelve !ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(502);
  });

  it("502 cuando Flow responde sin url o token", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "respuesta inesperada" }),
    });
    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(502);
  });

  it("200 con redirectUrl cuando Flow responde correctamente", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://sandbox.flow.cl/pay", token: "abc123" }),
    });

    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toContain("abc123");
    expect(body.redirectUrl).toContain("flow.cl");
  });

  it("redirectUrl combina url + token con formato correcto", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://sandbox.flow.cl/pay", token: "tok_xyz" }),
    });

    const res = await POST(postJson({ email: "comprador@empresa.cl" }));
    const body = await res.json();
    expect(body.redirectUrl).toBe("https://sandbox.flow.cl/pay?token=tok_xyz");
  });

  it("500 cuando getCurrentPrice falla (Supabase caído)", async () => {
    const { getCurrentPrice } = await import("@/lib/ebook-pricing");
    vi.mocked(getCurrentPrice).mockRejectedValueOnce(new Error("DB down"));

    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/precio/i);
  });
});
