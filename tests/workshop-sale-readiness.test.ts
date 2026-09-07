import { beforeEach, describe, expect, it, vi } from "vitest";

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
});
