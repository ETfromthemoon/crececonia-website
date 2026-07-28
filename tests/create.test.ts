import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const { mockGetCurrentPrice } = vi.hoisted(() => ({
  mockGetCurrentPrice: vi.fn().mockResolvedValue({
    price: 10800,
    tier: "super-early",
    remaining: 7,
    originalPrice: 27000,
  }),
}));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: mockGetCurrentPrice }));

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

function flowBody() {
  return new URLSearchParams(mockFetch.mock.calls[0][1].body as string);
}

describe("POST /api/flow/create — 1 solo libro (comportamiento existente)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400 cuando no se pasa email", async () => {
    const res = await POST(postJson({ resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  it("400 para email sin formato válido", async () => {
    const res = await POST(postJson({ email: "no-es-un-email", resources: [DEFAULT_EBOOK_RESOURCE] }));
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
    const res = await POST(postJson({ email: "user @test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(400);
  });

  it("usa el libro por defecto si no se manda `resources` (cliente viejo)", async () => {
    flowOk();
    const res = await POST(postJson({ email: "user@test.com" }));
    expect(res.status).toBe(200);
    expect(mockGetCurrentPrice).toHaveBeenCalledWith(DEFAULT_EBOOK_RESOURCE);
  });

  it("502 cuando Flow API devuelve !ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(502);
  });

  it("502 cuando Flow responde sin url o token", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "respuesta inesperada" }),
    });
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(502);
  });

  it("200 con redirectUrl cuando Flow responde correctamente", async () => {
    flowOk();
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toContain("tok_ok");
    expect(body.redirectUrl).toContain("flow.cl");
  });

  it("redirectUrl combina url + token con formato correcto", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://sandbox.flow.cl/pay", token: "tok_xyz" }),
    });
    const res = await POST(postJson({ email: "comprador@empresa.cl", resources: [DEFAULT_EBOOK_RESOURCE] }));
    const body = await res.json();
    expect(body.redirectUrl).toBe("https://sandbox.flow.cl/pay?token=tok_xyz");
  });

  it("500 cuando getCurrentPrice falla (Supabase caído)", async () => {
    mockGetCurrentPrice.mockRejectedValueOnce(new Error("DB down"));
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/precio/i);
  });

  it("cobra el monto con descuento cuando el código es válido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "PROMO-ABC",
      type: "percent",
      amount: 50,
      finalPrice: 5400,
    });
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE], discountCode: "promo-abc" })
    );
    expect(res.status).toBe(200);
    expect(flowBody().get("amount")).toBe("5400");
  });

  it("400 y no llama a Flow cuando el código es inválido", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({ valid: false, reason: "Este código venció." });
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE], discountCode: "VENCIDO" })
    );
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
    await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE], discountCode: "X", amount: 1 })
    );
    expect(flowBody().get("amount")).toBe("10000");
  });

  it("commerceOrder queda corto: no lleva el tier ni el código embebidos", async () => {
    flowOk();
    mockValidateDiscount.mockResolvedValue({
      valid: true,
      code: "PREFIJOLARGO-ABCD1234",
      type: "percent",
      amount: 10,
      finalPrice: 9720,
    });
    await POST(
      postJson({
        email: "user@test.com",
        resources: [DEFAULT_EBOOK_RESOURCE],
        discountCode: "PREFIJOLARGO-ABCD1234",
      })
    );
    const order = flowBody().get("commerceOrder") ?? "";
    expect(order).toMatch(/^ebook-\d+-[a-z0-9]+$/);
    expect(order).not.toContain("PREFIJOLARGO");
    expect(order).not.toContain("super-early");
  });

  it("la venta sigue si falla el registro de la orden pendiente", async () => {
    flowOk();
    mockPendingInsert.mockResolvedValueOnce({ error: { message: "DB down" } });
    const res = await POST(postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE] }));
    expect(res.status).toBe(200);
    expect((await res.json()).redirectUrl).toContain("tok_ok");
  });
});

describe("POST /api/flow/create — combos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentPrice.mockImplementation(async (resource: string) => {
      if (resource === "ebook:agentes-de-ia") {
        return { price: 15000, tier: "regular", remaining: null, originalPrice: 15000 };
      }
      return { price: 10800, tier: "super-early", remaining: 7, originalPrice: 27000 };
    });
  });

  it("400 si algún resource no existe en el catálogo", async () => {
    flowOk();
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, "ebook:no-existe"] })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("400 si algún resource está coming-soon (no active en el catálogo real)", async () => {
    flowOk();
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, "ebook:sitios-web-ia"] })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("400 si se manda discountCode junto con 2+ resources", async () => {
    flowOk();
    const res = await POST(
      postJson({
        email: "user@test.com",
        resources: [DEFAULT_EBOOK_RESOURCE, "ebook:agentes-de-ia"],
        discountCode: "PROMO",
      })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("400 si se repite el mismo libro dos veces en el combo", async () => {
    flowOk();
    const res = await POST(
      postJson({ email: "user@test.com", resources: [DEFAULT_EBOOK_RESOURCE, DEFAULT_EBOOK_RESOURCE] })
    );
    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// La matemática del descuento por combo (10%/20% sobre 2-3 libros DISTINTOS)
// ya está cubierta de forma exhaustiva y aislada en tests/ebook-bundles.test.ts
// (computeBundleTotal es una función pura, no necesita mocks de Supabase/Flow).
// Este archivo no repite esa matemática con 2 libros activos reales porque hoy
// el catálogo real (lib/ebook-catalog.ts) solo tiene 1 libro `active` — no hay
// forma de ejercitar ese camino sin mockear el catálogo, y hacerlo probaría un
// escenario que no puede ocurrir en producción todavía. Cuando se active el
// libro 2, agregar acá un test de combo real de 2 resources distintos con el
// descuento del 10% verificado end-to-end es la primera prueba de regresión a
// escribir.
