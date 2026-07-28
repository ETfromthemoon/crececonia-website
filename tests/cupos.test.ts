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

  it("pasa el resource de la query string", async () => {
    mockGetCurrentPrice.mockResolvedValue({ price: 27000, tier: "regular", remaining: null, originalPrice: 27000 });
    await GET(reqWith("ebook:agentes-de-ia"));
    expect(mockGetCurrentPrice).toHaveBeenCalledWith("ebook:agentes-de-ia");
  });

  it("devuelve el fallback 200 si getCurrentPrice falla", async () => {
    mockGetCurrentPrice.mockRejectedValue(new Error("DB down"));
    const res = await GET(reqWith());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tier).toBe("regular");
  });
});
