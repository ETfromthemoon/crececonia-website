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
  Resend: vi.fn(function(this: Record<string, unknown>) {
    this.emails = { send: mockResendSend };
  }),
}));

vi.mock("@/lib/ebook-pricing", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ebook-pricing")>();
  return {
    ...real,
    decrementCupo: vi.fn().mockResolvedValue(undefined),
  };
});

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/flow/confirm/route";

// ── helpers ──────────────────────────────────────────────────────────────────
function flowWebhook(token: string | null) {
  const body = token ? `token=${token}` : "";
  return new Request("https://test.com/api/flow/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

function mockFlowStatus(status: number, amount = 10800) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      status,
      email: "comprador@test.com",
      amount,
      flowOrder: 12345,
    }),
  });
}

function setupDb(existingData: { id: string } | null) {
  mockFrom.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybySingle: vi.fn().mockResolvedValue({ data: existingData }),
    // maybeSingle con typo correcto
    maybeSingle: vi.fn().mockResolvedValue({ data: existingData }),
    insert: mockInsert,
  }));
}

// ── tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/flow/confirm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 200 cuando no hay token en el body", async () => {
    const res = await POST(flowWebhook(null));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("responde 200 sin insertar cuando Flow retorna status != 2", async () => {
    mockFlowStatus(1);
    setupDb(null);
    const res = await POST(flowWebhook("tok_pendiente"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("inserta compra y envía email cuando Flow confirma pago (status=2)", async () => {
    mockFlowStatus(2);
    setupDb(null);

    const res = await POST(flowWebhook("tok_nuevo"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "comprador@test.com",
        amount: 10800,
        flow_token: "tok_nuevo",
        tier: "super-early",
      })
    );
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("no reinserta ni reenvía email si el token ya está en DB (idempotencia)", async () => {
    mockFlowStatus(2);
    setupDb({ id: "existing-uuid" });

    const res = await POST(flowWebhook("tok_duplicado"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("retorna 200 aunque el envío de email falle", async () => {
    mockFlowStatus(2);
    setupDb(null);
    mockResendSend.mockRejectedValueOnce(new Error("Resend timeout"));

    const res = await POST(flowWebhook("tok_email_fail"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("retorna 200 cuando Flow API falla", async () => {
    mockFetch.mockRejectedValue(new Error("Flow timeout"));
    const res = await POST(flowWebhook("tok_flow_down"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("asigna tier early para monto 17900", async () => {
    mockFlowStatus(2, 17900);
    setupDb(null);
    await POST(flowWebhook("tok_early"));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "early", amount: 17900 })
    );
  });

  it("asigna tier regular para monto 27000", async () => {
    mockFlowStatus(2, 27000);
    setupDb(null);
    await POST(flowWebhook("tok_regular"));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ tier: "regular", amount: 27000 })
    );
  });
});
