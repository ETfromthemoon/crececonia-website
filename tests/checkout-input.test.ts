import { beforeEach, describe, expect, it, vi } from "vitest";

const { price, discount, insert, capture } = vi.hoisted(() => ({
  price: vi.fn(), discount: vi.fn(), insert: vi.fn(), capture: vi.fn(),
}));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: price }));
vi.mock("@/lib/discount-codes", () => ({ validateDiscountCode: discount }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: () => ({ insert }) }) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: capture }));
import { POST as checkout } from "@/app/api/flow/create/route";
import { POST as validate } from "@/app/api/ebook/discount/validate/route";

const request = (body: unknown) => new Request("https://test.com/api", {
  method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" },
});

describe("entradas públicas del checkout", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    { email: ["buyer@example.com"] },
    { email: "buyer@example.com", discountCode: 42 },
    { email: "buyer@example.com", resources: "ebook:agentes-de-ia" },
    { email: "buyer@example.com", resources: [] },
  ])("rechaza tipos inválidos antes de preparar un cobro: %j", async (body) => {
    const response = await checkout(request(body));
    expect(response.status).toBe(400);
    expect(price).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it.each([42, {}, ["CODE"]])("rechaza un código que no sea texto: %j", async (code) => {
    const response = await validate(request({ code }));
    expect(response.status).toBe(400);
    expect(price).not.toHaveBeenCalled();
    expect(discount).not.toHaveBeenCalled();
  });
});
