import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { validate } = vi.hoisted(() => ({ validate: vi.fn() }));
vi.mock("@/lib/discount-codes", () => ({ validateDiscountCode: validate }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: vi.fn().mockResolvedValue({ price: 17900 }) }));
import { POST } from "@/app/api/ebook/discount/validate/route";

describe("Códigos durante y después de la venta flash", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ toFake: ["Date"] }); });
  afterEach(() => vi.useRealTimers());
  const request = () => new Request("https://test.com/api/ebook/discount/validate", {
    method: "POST", body: JSON.stringify({ code: "EXTRA" }), headers: { "Content-Type": "application/json" },
  });
  it("no valida ni consume un código mientras el descuento automático está activo", async () => {
    vi.setSystemTime(new Date("2026-11-07T15:00:00-03:00"));
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect((await response.json()).reason).toContain("automáticamente");
    expect(validate).not.toHaveBeenCalled();
  });
  it("vuelve a permitir códigos al terminar la campaña", async () => {
    vi.setSystemTime(new Date("2026-11-08T00:00:00-03:00"));
    validate.mockResolvedValue({ valid: true, code: "EXTRA", finalPrice: 16110 });
    expect((await POST(request())).status).toBe(200);
    expect(validate).toHaveBeenCalledWith("EXTRA", 17900);
  });
});
