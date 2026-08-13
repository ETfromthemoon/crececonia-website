import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPurchasedBooks } = vi.hoisted(() => ({ mockGetPurchasedBooks: vi.fn() }));
vi.mock("@/lib/ebook-purchased-resources", () => ({ getPurchasedBooksByToken: mockGetPurchasedBooks }));

const mockStorageDownload = vi.fn();
const mockStorageFrom = vi.fn(() => ({ download: mockStorageDownload }));
let purchaseRows: unknown[] = [];
const filters: Array<[string, unknown]> = [];

function purchaseChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn((field: string, value: unknown) => {
    filters.push([field, value]);
    return chain;
  });
  chain.limit = vi.fn(() => Promise.resolve({ data: purchaseRows }));
  chain.single = vi.fn(() => Promise.resolve({ data: { download_count: 0 } }));
  chain.update = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: null }).then(resolve);
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: () => purchaseChain(), storage: { from: mockStorageFrom } }),
}));

import { GET } from "@/app/api/ebook/download/route";

const PDF = Buffer.from("%PDF-test");

function req(params: Record<string, string>) {
  const url = new URL("https://test.com/api/ebook/download");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new Request(url);
}

describe("GET /api/ebook/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purchaseRows = [];
    filters.length = 0;
    mockGetPurchasedBooks.mockResolvedValue([]);
    mockStorageDownload.mockResolvedValue({ data: { arrayBuffer: async () => PDF }, error: null });
  });

  it("requiere un token de descarga; un email solo no es una credencial", async () => {
    expect((await GET(req({ email: "comprador@test.com" }))).status).toBe(401);
  });

  it("entrega un PDF cuando token y resource coinciden con una compra registrada", async () => {
    purchaseRows = [{ id: "purchase-1", email: "comprador@test.com" }];

    const res = await GET(req({ token: "tok-1", resource: "ebook:agentes-de-ia", format: "a4" }));

    expect(res.status).toBe(200);
    expect(filters).toContainEqual(["flow_token", "tok-1"]);
    expect(filters).toContainEqual(["resource", "ebook:agentes-de-ia"]);
    expect(mockStorageDownload).toHaveBeenCalledWith("agentes-de-ia-a4.pdf");
  });

  it("durante la carrera webhook/retorno entrega solo resources del manifiesto pagado", async () => {
    mockGetPurchasedBooks.mockResolvedValue([{ resource: "ebook:agentes-de-ia", title: "Agentes de IA" }]);

    expect((await GET(req({ token: "tok-pagado", resource: "ebook:agentes-de-ia" }))).status).toBe(200);
    expect((await GET(req({ token: "tok-pagado", resource: "ebook:claude-nivel-experto" }))).status).toBe(404);
  });

  it("rechaza un resource que no existe aunque el token sea válido", async () => {
    purchaseRows = [{ id: "purchase-1", email: "comprador@test.com" }];
    expect((await GET(req({ token: "tok-1", resource: "ebook:no-existe" }))).status).toBe(404);
  });
});
