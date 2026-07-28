import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted garantiza que estas variables existen cuando los factories de
// vi.mock se ejecutan (vi.mock se hoistea al tope del archivo).
const { mockInsert, mockResendSend, mockFrom } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-id" }),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function (this: Record<string, unknown>) {
    this.emails = { send: mockResendSend };
  }),
}));

import { POST } from "@/app/api/ebook/waitlist/route";

// ── helpers ──────────────────────────────────────────────────────────────────
function waitlistRequest(body: unknown) {
  return new Request("https://test.com/api/ebook/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setupDb(error: { code: string; message: string } | null) {
  mockInsert.mockResolvedValue({ error });
  mockFrom.mockImplementation(() => ({ insert: mockInsert }));
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/ebook/waitlist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza un email inválido", async () => {
    const res = await POST(waitlistRequest({ email: "no-es-email", resource: "ebook:agentes-de-ia" }));
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rechaza cuando falta el resource", async () => {
    const res = await POST(waitlistRequest({ email: "lead@test.com" }));
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("guarda el email en la waitlist propia y envía confirmación por Resend", async () => {
    setupDb(null);
    const res = await POST(
      waitlistRequest({ email: "Lead@Test.com", resource: "ebook:agentes-de-ia", source: "ebook-agentes-ia-proximamente" })
    );
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "lead@test.com",
        resource: "ebook:agentes-de-ia",
        source: "ebook-agentes-ia-proximamente",
      })
    );
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("no falla si el email ya estaba suscrito a ese recurso (unique violation)", async () => {
    setupDb({ code: "23505", message: "duplicate key value violates unique constraint" });
    const res = await POST(waitlistRequest({ email: "repetido@test.com", resource: "ebook:agentes-de-ia" }));
    expect(res.status).toBe(200);
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("responde 500 si Supabase falla por otra razón", async () => {
    setupDb({ code: "500", message: "db down" });
    const res = await POST(waitlistRequest({ email: "x@test.com", resource: "ebook:agentes-de-ia" }));
    expect(res.status).toBe(500);
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("responde 200 aunque el envío de confirmación por Resend falle", async () => {
    setupDb(null);
    mockResendSend.mockRejectedValueOnce(new Error("Resend timeout"));
    const res = await POST(waitlistRequest({ email: "y@test.com", resource: "ebook:agentes-de-ia" }));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("nunca llama a autodrive.cl", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    setupDb(null);
    await POST(waitlistRequest({ email: "z@test.com", resource: "ebook:agentes-de-ia" }));
    expect(mockFetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
