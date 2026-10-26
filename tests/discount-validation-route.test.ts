import { beforeEach, describe, expect, it, vi } from "vitest";

const { price, validate } = vi.hoisted(() => ({ price: vi.fn(), validate: vi.fn() }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: price }));
vi.mock("@/lib/discount-codes", () => ({ validateDiscountCode: validate }));
import { POST } from "@/app/api/ebook/discount/validate/route";

function request(body: unknown) {
  return new Request("https://www.crececonia.cl/api/ebook/discount/validate", {
    method: "POST", body: JSON.stringify(body),
  });
}

describe("validación pública de descuentos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    price.mockResolvedValue({ price: 17_900 });
    validate.mockResolvedValue({ valid: true, finalPrice: 16_110 });
  });

  it.each([
    { code: 123 }, { code: ["TEST"] }, { code: {} }, { code: true },
    { code: "   " }, { code: "TEST", resource: [] },
    { code: "TEST", previewKey: {} },
  ])("rechaza tipos inválidos sin consultar precio ni código: %j", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(price).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
  });

  it("conserva el libro por defecto para clientes antiguos sin resource", async () => {
    const response = await POST(request({ code: " TEST " }));
    expect(response.status).toBe(200);
    expect(price).toHaveBeenCalledWith("ebook:de-cero-a-claude-en-una-semana");
    expect(validate).toHaveBeenCalledWith("TEST", 17_900);
  });

  it("valida contra el recurso solicitado", async () => {
    await POST(request({ code: "TEST", resource: "ebook:claude-nivel-experto" }));
    expect(price).toHaveBeenCalledWith("ebook:claude-nivel-experto");
  });
});
