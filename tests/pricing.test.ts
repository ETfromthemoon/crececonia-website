import { describe, it, expect, vi, beforeEach } from "vitest";
import { determineTier, getCurrentPrice, decrementCupo } from "@/lib/ebook-pricing";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

// Mock Supabase. vi.hoisted porque vi.mock se hoistea por encima de estas
// declaraciones y el factory se evalúa al importar el módulo bajo prueba.
const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom, rpc: mockRpc }),
}));

describe("determineTier", () => {
  it("devuelve super-early para monto ≤ 10800", () => {
    expect(determineTier(10800, DEFAULT_EBOOK_RESOURCE)).toBe("super-early");
    expect(determineTier(100, DEFAULT_EBOOK_RESOURCE)).toBe("super-early");
  });

  it("devuelve early para monto entre 10801 y 17900", () => {
    expect(determineTier(17900, DEFAULT_EBOOK_RESOURCE)).toBe("early");
    expect(determineTier(10801, DEFAULT_EBOOK_RESOURCE)).toBe("early");
  });

  it("devuelve regular para monto > 17900", () => {
    expect(determineTier(27000, DEFAULT_EBOOK_RESOURCE)).toBe("regular");
    expect(determineTier(17901, DEFAULT_EBOOK_RESOURCE)).toBe("regular");
  });

  it("lanza para un resource que no está activo en el catálogo", () => {
    expect(() => determineTier(10000, "ebook:no-existe")).toThrow(/no comprable/i);
  });
});

describe("getCurrentPrice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cobra el precio regular del libro inicial sin consultar cupos antiguos", async () => {
    const result = await getCurrentPrice(DEFAULT_EBOOK_RESOURCE);
    expect(result.tier).toBe("regular");
    expect(result.price).toBe(27000);
    expect(result.remaining).toBeNull();
    expect(result.originalPrice).toBe(27000);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("usa el precio regular propio de los otros libros activos", async () => {
    const result = await getCurrentPrice("ebook:claude-nivel-experto");
    expect(result).toMatchObject({ price: 19700, tier: "regular", remaining: null, originalPrice: 19700 });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("lanza para un resource inactivo o inexistente", async () => {
    await expect(getCurrentPrice("ebook:no-existe")).rejects.toThrow(/no comprable/i);
  });
});

describe("decrementCupo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ error: null });
  });

  it("no hace nada para tier regular", async () => {
    await decrementCupo(DEFAULT_EBOOK_RESOURCE, "regular");
    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("incrementa el cupo con una sola sentencia atómica (RPC), incluyendo el resource", async () => {
    await decrementCupo(DEFAULT_EBOOK_RESOURCE, "super-early");
    expect(mockRpc).toHaveBeenCalledWith("increment_cupo_used", {
      p_resource: DEFAULT_EBOOK_RESOURCE,
      p_tier: "super-early",
    });
  });

  it("nunca escribe un valor absoluto con un read-then-write", async () => {
    // Regresión: antes leía `used` y escribía `used + 1`. Si el SELECT fallaba,
    // escribía used = 1 y borraba el conteo real, reabriendo el tier con 60% off.
    await decrementCupo(DEFAULT_EBOOK_RESOURCE, "early");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("lanza cuando la RPC falla, en vez de corromper el contador", async () => {
    mockRpc.mockResolvedValue({ error: { message: "statement timeout" } });
    await expect(decrementCupo(DEFAULT_EBOOK_RESOURCE, "super-early")).rejects.toThrow(
      /no se pudo incrementar el cupo/i
    );
  });
});
