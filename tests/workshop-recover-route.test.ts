import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockFlowSign } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFlowSign: vi.fn(() => "signature"),
}));

vi.mock("@/lib/flow", () => ({ flowSign: mockFlowSign, getFlowBase: () => "https://flow.test/api" }));
vi.mock("@/lib/workshop-recovery", () => ({ hashWorkshopRecoveryToken: () => "hashed-token" }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { GET } from "@/app/api/workshop/recover/route";

const token = "a".repeat(43);

describe("GET /api/workshop/recover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FLOW_API_KEY = "flow-key";
    process.env.FLOW_SECRET_KEY = "flow-secret";
    mockRpc.mockImplementation((name: string) => {
      if (name === "begin_workshop_recovery_redemption") return Promise.resolve({ data: [{ recovery_id: "recovery-1", email: "persona@test.com", discounted_amount: 18_000, payment_url: null }], error: null });
      if (name === "workshop_product_availability") return Promise.resolve({ data: [{ product_id: "product-1", offer_id: "offer-1", offer_key: "general" }], error: null });
      if (name === "create_class_order") return Promise.resolve({ data: [{ order_id: "order-1" }], error: null });
      return Promise.resolve({ data: true, error: null });
    });
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ url: "https://pay.flow.test/pay", token: "flow-token" }) });
  });

  it("crea un pago Flow directo por $18.000 y redirige", async () => {
    const response = await GET(new Request(`https://www.crececonia.cl/api/workshop/recover?token=${token}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://pay.flow.test/pay?token=flow-token");
    const requestBody = String(mockFetch.mock.calls[0][1].body);
    expect(requestBody).toContain("amount=18000");
    expect(requestBody).toContain("email=persona%40test.com");
    expect(mockRpc).toHaveBeenCalledWith("complete_workshop_recovery_redemption", expect.objectContaining({ p_recovery_id: "recovery-1" }));
  });

  it("reutiliza el pago ya creado y no genera órdenes duplicadas", async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ recovery_id: "recovery-1", email: "persona@test.com", discounted_amount: 18_000, payment_url: "https://pay.flow.test/existing" }], error: null });
    const response = await GET(new Request(`https://www.crececonia.cl/api/workshop/recover?token=${token}`));
    expect(response.headers.get("location")).toBe("https://pay.flow.test/existing");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
