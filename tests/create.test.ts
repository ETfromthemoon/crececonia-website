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

// La ruta guarda el tier/código en ebook_pending_orders. Sin este mock se
// construiría un cliente real de Supabase que además pisaría el fetch stubeado.
const { mockPendingInsert, mockValidateDiscount } = vi.hoisted(() => ({
  mockPendingInsert: vi.fn().mockResolvedValue({ error: null }),
  mockValidateDiscount: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert: mockPendingInsert }) }),
}));

vi.mock("@/lib/discount-codes", () => ({
  validateDiscountCode: mockValidateDiscount,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function flowOk() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ url: "https://sandbox.flow.cl/pay", token: "tok_ok" }),
  });
}

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

  // ── códigos de descuento ───────────────────────────────────────────────────

  function flowBody() {
    return new URLSearchParams(mockFetch.mock.calls[0][1].body as string);
  }

  it("cobra el monto con descuento cuando el código es válido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "PROMO-ABC",
      type: "percent",
      amount: 50,
      finalPrice: 5400,
    });

    const res = await POST(postJson({ email: "user@test.com", discountCode: "promo-abc" }));
    expect(res.status).toBe(200);
    expect(flowBody().get("amount")).toBe("5400");
  });

  it("400 y no llama a Flow cuando el código es inválido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({ valid: false, reason: "Este código venció." });

    const res = await POST(postJson({ email: "user@test.com", discountCode: "VENCIDO" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/venció/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ignora el precio base y usa finalPrice (no se puede pagar de menos por el cliente)", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "X",
      type: "fixed",
      amount: 800,
      finalPrice: 10000,
    });

    // El cliente manda un monto propio: debe ser ignorado por completo.
    await POST(postJson({ email: "user@test.com", discountCode: "X", amount: 1 }));
    expect(flowBody().get("amount")).toBe("10000");
  });

  it("commerceOrder queda corto: no lleva el tier ni el código embebidos", async () => {
    // Regresión: el tier y el código viajaban dentro de commerceOrder, que puede
    // tener un máximo de caracteres no documentado en Flow.
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "PREFIJOLARGO-ABCD1234",
      type: "percent",
      amount: 10,
      finalPrice: 9720,
    });

    await POST(postJson({ email: "user@test.com", discountCode: "PREFIJOLARGO-ABCD1234" }));
    const order = flowBody().get("commerceOrder") ?? "";
    expect(order).toMatch(/^ebook-\d+-[a-z0-9]+$/);
    expect(order).not.toContain("PREFIJOLARGO");
    expect(order).not.toContain("super-early");
  });

  it("la venta sigue si falla el registro de la orden pendiente", async () => {
    // Regresión: ese insert es contabilidad. Si Supabase falla, no puede
    // tumbar el checkout de alguien que quiere pagar.
    flowOk();
    mockPendingInsert.mockResolvedValueOnce({ error: { message: "DB down" } });

    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(200);
    expect((await res.json()).redirectUrl).toContain("tok_ok");
  });
});
