import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockReadiness } = vi.hoisted(() => ({ mockRpc: vi.fn(), mockReadiness: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/workshop-readiness", () => ({ getWorkshopFulfillmentReadiness: mockReadiness }));
vi.mock("@/lib/discount-codes", () => ({ validateDiscountCode: vi.fn() }));
vi.mock("@/lib/flow", () => ({ flowSign: vi.fn(), getFlowBase: () => "https://flow.test" }));

import { GET } from "@/app/api/workshop/availability/route";
import { POST } from "@/app/api/workshop/create/route";

const offer = {
  product_id: "product-1",
  offer_id: "offer-1",
  offer_key: "recording",
  amount_minor: 20_000,
  total_cupos: 1_000_000,
  sold_cupos: 4,
  reserved_cupos: 0,
  next_amount_minor: 20_000,
  sales_today: 0,
};

describe("workshop evergreen sale readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadiness.mockResolvedValue({ ready: false, missing: ["recording"] });
    mockRpc.mockImplementation((name: string) => name === "workshop_product_availability"
      ? Promise.resolve({ data: [offer], error: null })
      : Promise.resolve({ data: true, error: null }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it("no publica el checkout si falta un entregable", async () => {
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("venta está pausada") });
  });

  it("vuelve a verificar los entregables antes de crear una orden", async () => {
    const response = await POST(new Request("https://crececonia.cl/api/workshop/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alumno@test.com", offerKey: "recording" }),
    }));
    expect(response.status).toBe(503);
    expect(mockRpc).not.toHaveBeenCalledWith("create_class_order", expect.anything());
  });

  it("crea la orden y el pago Flow cuando todos los entregables están verificados", async () => {
    mockReadiness.mockResolvedValue({ ready: true, missing: [] });
    mockRpc.mockImplementation((name: string) => {
      if (name === "workshop_product_availability") return Promise.resolve({ data: [offer], error: null });
      if (name === "create_class_order") return Promise.resolve({ data: [{ order_id: "order-1" }], error: null });
      return Promise.resolve({ data: true, error: null });
    });
    process.env.FLOW_API_KEY = "flow-key";
    process.env.FLOW_SECRET_KEY = "flow-secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://pay.flow.test/pay", token: "flow-token" }),
    }));

    const response = await POST(new Request("https://crececonia.cl/api/workshop/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "alumno@test.com", offerKey: "recording" }),
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectUrl: "https://pay.flow.test/pay?token=flow-token", amount: 20_000 });
    expect(mockRpc).toHaveBeenCalledWith("create_class_order", expect.objectContaining({
      p_product_id: "product-1",
      p_offer_id: "offer-1",
      p_email: "alumno@test.com",
      p_amount_minor: 20_000,
    }));
  });
});
