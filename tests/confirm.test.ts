import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendEmail, mockPurchaseNotice, mockCapture, mockDecrement, mockRedeem, mockInsert, mockDelete } = vi.hoisted(() => ({
  mockSendEmail: vi.fn().mockResolvedValue(undefined),
  mockPurchaseNotice: vi.fn().mockResolvedValue(undefined),
  mockCapture: vi.fn().mockResolvedValue(undefined),
  mockDecrement: vi.fn().mockResolvedValue(undefined),
  mockRedeem: vi.fn().mockResolvedValue(true),
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockDelete: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("@/lib/ebook-delivery-email", () => ({ sendEbookDeliveryEmail: mockSendEmail }));
vi.mock("@/lib/purchase-notification-email", () => ({ sendPurchaseNotification: mockPurchaseNotice }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: mockCapture }));
vi.mock("@/lib/ebook-pricing", () => ({ decrementCupo: mockDecrement }));
vi.mock("@/lib/discount-codes", () => ({ redeemDiscountCode: mockRedeem }));

let pendingResources: unknown = null;
let existingResources = new Set<string>();
let pendingMissingHasPurchase = false;

function pendingChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({
    data: pendingResources === null ? null : { resources: pendingResources, discount_code: null },
    error: null,
  });
  chain.delete = vi.fn(() => chain);
  chain.then = undefined;
  return chain;
}

function purchaseChain() {
  const chain: Record<string, unknown> = {};
  let resource = "";
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn((field: string, value: unknown) => {
    if (field === "resource") resource = String(value);
    return chain;
  });
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: existingResources.has(resource) ? { id: "existing" } : null, error: null }));
  chain.limit = vi.fn(() => Promise.resolve({ data: pendingMissingHasPurchase ? [{ id: "existing" }] : [], error: null }));
  chain.insert = mockInsert;
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => {
      if (table === "ebook_pending_orders") {
        const chain = pendingChain();
        chain.delete = vi.fn(() => ({ eq: vi.fn(() => mockDelete()) }));
        return chain;
      }
      return purchaseChain();
    },
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/flow/confirm/route";

const BOOK_1 = "ebook:de-cero-a-claude-en-una-semana";
const AGENTES = "ebook:agentes-de-ia";

function flowStatus(amount = 19_440) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 2,
      payer: "comprador@test.com",
      amount,
      flowOrder: 99,
      commerceOrder: "ebook-123-abc123",
    }),
  });
}

function webhook() {
  return new Request("https://test.com/api/flow/confirm", {
    method: "POST",
    body: new URLSearchParams({ token: "tok_pago" }),
  });
}

describe("POST /api/flow/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pendingResources = null;
    existingResources = new Set();
    pendingMissingHasPurchase = false;
    mockInsert.mockResolvedValue({ error: null });
    mockDelete.mockResolvedValue({ error: null });
    mockSendEmail.mockResolvedValue(undefined);
    flowStatus();
  });

  it("entrega el combo completo una vez, registra sus dos compras y emite un evento de orden", async () => {
    pendingResources = [
      { resource: BOOK_1, tier: "super-early", amount: 9_720, analytics_distinct_id: "anon-1" },
      { resource: AGENTES, tier: "regular", amount: 9_720, analytics_distinct_id: "anon-1" },
    ];

    const res = await POST(webhook());

    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockDecrement).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith({
      email: "comprador@test.com",
      grants: [
        { resource: BOOK_1, token: "tok_pago" },
        { resource: AGENTES, token: "tok_pago" },
      ],
    });
    expect(mockCapture).toHaveBeenCalledWith(
      "ebook_purchase_confirmed",
      "anon-1",
      expect.objectContaining({ item_count: 2, amount: 19_440, order_id: "ebook-123-abc123" })
    );
    expect(mockPurchaseNotice).toHaveBeenCalledWith(expect.objectContaining({
      kind: "Ebook",
      buyerEmail: "comprador@test.com",
      amount: 19_440,
      orderId: "ebook-123-abc123",
    }));
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it("rechaza la entrega si el monto acreditado no coincide con el manifiesto", async () => {
    pendingResources = [{ resource: BOOK_1, tier: "regular", amount: 27_000 }];

    const res = await POST(webhook());

    expect(res.status).toBe(500);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("no adivina el ebook por defecto cuando falta el manifiesto", async () => {
    const res = await POST(webhook());

    expect(res.status).toBe(500);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("acepta un webhook tardío si la compra ya quedó registrada", async () => {
    pendingMissingHasPurchase = true;

    const res = await POST(webhook());

    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("mantiene la orden pendiente y solicita reintento si falla el email", async () => {
    pendingResources = [
      { resource: BOOK_1, tier: "super-early", amount: 9_720 },
      { resource: AGENTES, tier: "regular", amount: 9_720 },
    ];
    mockSendEmail.mockRejectedValueOnce(new Error("Resend timeout"));

    const res = await POST(webhook());

    expect(res.status).toBe(500);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
