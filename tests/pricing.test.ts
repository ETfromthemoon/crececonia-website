import { describe, it, expect, vi, beforeEach } from "vitest";
import { determineTier, getCurrentPrice, decrementCupo } from "@/lib/ebook-pricing";

// Mock Supabase
const mockFrom = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "update", "single", "maybeSingle"];
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  // terminal .then-able value
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  // Make it awaitable by default resolving to result
  const promise = Promise.resolve(result);
  (chain as unknown as Promise<unknown>).then = promise.then.bind(promise);
  return chain;
}

describe("determineTier", () => {
  it("devuelve super-early para monto ≤ 10800", () => {
    expect(determineTier(10800)).toBe("super-early");
    expect(determineTier(100)).toBe("super-early");
  });

  it("devuelve early para monto entre 10801 y 17900", () => {
    expect(determineTier(17900)).toBe("early");
    expect(determineTier(10801)).toBe("early");
  });

  it("devuelve regular para monto > 17900", () => {
    expect(determineTier(27000)).toBe("regular");
    expect(determineTier(17901)).toBe("regular");
  });
});

describe("getCurrentPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna tier super-early cuando hay cupos disponibles", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 3 },
        { tier: "early", total: 40, used: 0 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice();
    expect(result.tier).toBe("super-early");
    expect(result.price).toBe(10800);
    expect(result.remaining).toBe(7);
    expect(result.originalPrice).toBe(27000);
  });

  it("retorna tier early cuando super-early está agotado", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 10 },
        { tier: "early", total: 40, used: 15 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice();
    expect(result.tier).toBe("early");
    expect(result.price).toBe(17900);
    expect(result.remaining).toBe(25);
  });

  it("retorna tier regular cuando todos los cupos están agotados", async () => {
    const chain = makeChain({
      data: [
        { tier: "super-early", total: 10, used: 10 },
        { tier: "early", total: 40, used: 40 },
      ],
    });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice();
    expect(result.tier).toBe("regular");
    expect(result.price).toBe(27000);
    expect(result.remaining).toBeNull();
  });

  it("retorna regular cuando Supabase devuelve array vacío", async () => {
    const chain = makeChain({ data: [] });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice();
    expect(result.tier).toBe("regular");
    expect(result.price).toBe(27000);
  });

  it("retorna regular cuando Supabase devuelve null", async () => {
    const chain = makeChain({ data: null });
    mockFrom.mockReturnValue(chain);

    const result = await getCurrentPrice();
    expect(result.tier).toBe("regular");
  });
});

describe("decrementCupo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("no hace nada para tier regular", async () => {
    await decrementCupo("regular");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("incrementa used para super-early", async () => {
    const updateChain = { eq: vi.fn().mockResolvedValue({}) };
    const updateFn = vi.fn(() => updateChain);
    const selectChain = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { used: 3 } }),
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === "ebook_cupos") {
        return {
          select: vi.fn(() => selectChain),
          update: updateFn,
        };
      }
    });

    await decrementCupo("super-early");
    expect(updateFn).toHaveBeenCalledWith({ used: 4 });
  });
});
