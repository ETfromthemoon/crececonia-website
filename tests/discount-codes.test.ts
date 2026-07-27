import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockMaybeSingle, mockRpc } = vi.hoisted(() => ({
  mockMaybeSingle: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }),
    }),
    rpc: mockRpc,
  }),
}));

import { validateDiscountCode, redeemDiscountCode } from "@/lib/discount-codes";

const PRICE = 27000;
const IN_A_DAY = () => new Date(Date.now() + 86_400_000).toISOString();
const A_DAY_AGO = () => new Date(Date.now() - 86_400_000).toISOString();

/** Deja en el mock una fila de discount_codes válida, con overrides. */
function storedCode(over: Record<string, unknown> = {}) {
  mockMaybeSingle.mockResolvedValue({
    data: {
      code: "TEST1234",
      type: "percent",
      amount: 20,
      max_uses: 1,
      used_count: 0,
      expires_at: IN_A_DAY(),
      active: true,
      ...over,
    },
    error: null,
  });
}

describe("validateDiscountCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rechaza un código vacío sin consultar la DB", async () => {
    const r = await validateDiscountCode("   ", PRICE);
    expect(r.valid).toBe(false);
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it("rechaza un código que no existe", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const r = await validateDiscountCode("NOEXISTE", PRICE);
    expect(r.valid).toBe(false);
  });

  it("rechaza un código inactivo", async () => {
    storedCode({ active: false });
    const r = await validateDiscountCode("TEST1234", PRICE);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/activo/i);
  });

  it("rechaza un código vencido", async () => {
    storedCode({ expires_at: A_DAY_AGO() });
    const r = await validateDiscountCode("TEST1234", PRICE);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/venció/i);
  });

  it("acepta un código sin vencimiento (expires_at null)", async () => {
    storedCode({ expires_at: null });
    const r = await validateDiscountCode("TEST1234", PRICE);
    expect(r.valid).toBe(true);
  });

  it("rechaza cuando used_count alcanzó max_uses", async () => {
    storedCode({ max_uses: 3, used_count: 3 });
    const r = await validateDiscountCode("TEST1234", PRICE);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/límite/i);
  });

  it("acepta usos ilimitados (max_uses null) aunque ya se usó muchas veces", async () => {
    storedCode({ max_uses: null, used_count: 999 });
    const r = await validateDiscountCode("TEST1234", PRICE);
    expect(r.valid).toBe(true);
  });

  it("calcula el precio final de un descuento porcentual", async () => {
    storedCode({ type: "percent", amount: 25 });
    const r = await validateDiscountCode("TEST1234", 20000);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.finalPrice).toBe(15000);
  });

  it("calcula el precio final de un descuento de monto fijo", async () => {
    storedCode({ type: "fixed", amount: 5000 });
    const r = await validateDiscountCode("TEST1234", 20000);
    if (r.valid) expect(r.finalPrice).toBe(15000);
  });

  it("nunca baja del piso de $1.000 CLP, ni con 100% off", async () => {
    storedCode({ type: "percent", amount: 100 });
    const r = await validateDiscountCode("TEST1234", 27000);
    if (r.valid) expect(r.finalPrice).toBe(1000);
  });

  it("nunca produce un precio negativo con un monto fijo mayor al precio", async () => {
    storedCode({ type: "fixed", amount: 999_999 });
    const r = await validateDiscountCode("TEST1234", 27000);
    if (r.valid) expect(r.finalPrice).toBe(1000);
  });

  it("normaliza el código a mayúsculas y sin espacios", async () => {
    storedCode();
    const r = await validateDiscountCode("  test1234  ", PRICE);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.code).toBe("TEST1234");
  });
});

describe("redeemDiscountCode", () => {
  beforeEach(() => vi.clearAllMocks());

  it("canjea vía RPC atómica y devuelve true", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    await expect(redeemDiscountCode("test1234")).resolves.toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("redeem_discount_code", {
      p_code: "TEST1234",
    });
  });

  it("devuelve false cuando el código ya no era canjeable", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    await expect(redeemDiscountCode("TEST1234")).resolves.toBe(false);
  });

  it("lanza cuando la RPC falla", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "timeout" } });
    await expect(redeemDiscountCode("TEST1234")).rejects.toThrow(/no se pudo canjear/i);
  });
});
