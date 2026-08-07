import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetCurrentPrice } = vi.hoisted(() => ({ mockGetCurrentPrice: vi.fn() }));
vi.mock("@/lib/ebook-pricing", () => ({ getCurrentPrice: mockGetCurrentPrice }));

import { GET } from "@/app/api/ebook/cupos/route";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

function reqWith(resource?: string) {
  const url = resource
    ? `https://test.com/api/ebook/cupos?resource=${resource}`
    : "https://test.com/api/ebook/cupos";
  return new Request(url);
}

describe("GET /api/ebook/cupos", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa el libro por defecto cuando no viene ?resource=", async () => {
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    await GET(reqWith());
    expect(mockGetCurrentPrice).toHaveBeenCalledWith(DEFAULT_EBOOK_RESOURCE);
  });

  it("pasa el resource de la query string cuando el libro ya está vivo", async () => {
    // DEFAULT_EBOOK_RESOURCE no tiene visibleFrom — siempre está vivo, así
    // este test no depende de la hora real del reloj (a diferencia de los
    // otros 3 libros del catálogo, gateados a un instante de lanzamiento).
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    await GET(reqWith(DEFAULT_EBOOK_RESOURCE));
    expect(mockGetCurrentPrice).toHaveBeenCalledWith(DEFAULT_EBOOK_RESOURCE);
  });

  it("404 y no llama a getCurrentPrice para un resource que no existe en el catálogo", async () => {
    const res = await GET(reqWith("ebook:no-existe"));
    expect(res.status).toBe(404);
    expect(mockGetCurrentPrice).not.toHaveBeenCalled();
  });

  it("404 y no filtra el precio de un libro activo que aún no llegó a su visibleFrom", async () => {
    // Fija el reloj ANTES del lanzamiento del 2026-08-07 20:50 Chile para que
    // este test no dependa de en qué momento real se ejecuta — sin esto, el
    // test deja de probar el camino gateado apenas pasa esa fecha.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-07T10:00:00-04:00"));
    try {
      const res = await GET(reqWith("ebook:claude-nivel-experto"));
      expect(res.status).toBe(404);
      expect(mockGetCurrentPrice).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("devuelve el fallback 200 si getCurrentPrice falla", async () => {
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    mockGetCurrentPrice.mockRejectedValueOnce(new Error("DB down"));
    const res = await GET(reqWith(DEFAULT_EBOOK_RESOURCE));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("regular");
  });
});
