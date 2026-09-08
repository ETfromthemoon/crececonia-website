import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockDeliver, mockLate, mockCapture, mockMeta, mockRedeem } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockDeliver: vi.fn(),
  mockLate: vi.fn(),
  mockCapture: vi.fn(),
  mockMeta: vi.fn(),
  mockRedeem: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/workshop-delivery", () => ({ deliverWorkshopOrders: mockDeliver, deliverLateWorkshopAccessIfNeeded: mockLate }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: mockCapture }));
vi.mock("@/lib/meta-conversions-api", () => ({ captureMetaPurchase: mockMeta }));
vi.mock("@/lib/discount-codes", () => ({ redeemDiscountCode: mockRedeem }));
vi.mock("@/lib/flow", () => ({ flowSign: () => "signature", getFlowBase: () => "https://flow.test/api" }));

import { POST } from "@/app/api/workshop/confirm/route";

const payment = {
  status: 2,
  payer: "alumno@test.com",
  amount: 20_000,
  flowOrder: 987654,
  commerceOrder: "workshop-123456-valid",
};

const request = () => new Request("https://www.crececonia.cl/api/workshop/confirm", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: "token=flow-token",
});

describe("POST /api/workshop/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FLOW_API_KEY = "flow-key";
    process.env.FLOW_SECRET_KEY = "flow-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => payment }));
    mockRpc.mockImplementation((name: string) => {
      if (name === "get_workshop_order") return Promise.resolve({ data: [{ amount_minor: 20_000, email: "alumno@test.com" }], error: null });
      if (name === "finalize_class_order") return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: true, error: null });
    });
    mockDeliver.mockResolvedValue({ sentCount: 1 });
    mockLate.mockResolvedValue({ sentCount: 0 });
    mockCapture.mockResolvedValue(undefined);
    mockMeta.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("usa payer, finaliza el pago y dispara acceso, ebooks y aviso interno", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    expect(mockRpc).toHaveBeenCalledWith("finalize_class_order", {
      p_commerce_order: payment.commerceOrder,
      p_flow_token: "flow-token",
      p_flow_order: payment.flowOrder,
      p_paid_amount: payment.amount,
    });
    expect(mockDeliver.mock.calls.map((call) => call.slice(0, 2))).toEqual([
      ["welcome", payment.commerceOrder],
      ["ebooks", payment.commerceOrder],
      ["admin-notification", payment.commerceOrder],
    ]);
    expect(mockLate).toHaveBeenCalledWith(payment.commerceOrder);
    expect(mockCapture).toHaveBeenCalledWith("workshop_purchase_confirmed", payment.payer, expect.objectContaining({ amount: 20_000 }));
  });

  it("rechaza una respuesta cuyo pagador no coincide con la orden", async () => {
    mockRpc.mockImplementation((name: string) => name === "get_workshop_order"
      ? Promise.resolve({ data: [{ amount_minor: 20_000, email: "otra@test.com" }], error: null })
      : Promise.resolve({ data: true, error: null }));

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(mockDeliver).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalledWith("finalize_class_order", expect.anything());
  });
});
