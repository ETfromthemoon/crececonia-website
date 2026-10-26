import { beforeEach, describe, expect, it, vi } from "vitest";

let purchaseRows: Array<{ resource: string }> = [];
let pendingResources: unknown = null;

function purchasesChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve({ data: purchaseRows }).then(resolve);
  return chain;
}

function pendingChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: pendingResources ? { resources: pendingResources } : null }));
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: (table: string) => (table === "ebook_purchases" ? purchasesChain() : pendingChain()),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { getPurchasedBooksByToken } from "@/lib/ebook-purchased-resources";

describe("getPurchasedBooksByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    purchaseRows = [];
    pendingResources = null;
  });

  it("conserva las compras registradas aunque Flow no esté disponible", async () => {
    purchaseRows = [{ resource: "ebook:agentes-de-ia" }];
    mockFetch.mockRejectedValueOnce(new Error("Flow temporalmente no disponible"));
    await expect(getPurchasedBooksByToken("tok-1")).resolves.toEqual([
      { resource: "ebook:agentes-de-ia", title: "Agentes de IA para tu Negocio" },
    ]);
  });

  it("no autoriza una orden pendiente si Flow aún no la acredita", async () => {
    pendingResources = [{ resource: "ebook:agentes-de-ia", amount: 20_000 }];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 1, commerceOrder: "ebook-1" }) });
    await expect(getPurchasedBooksByToken("tok-pendiente")).resolves.toEqual([]);
  });

  it("autoriza exactamente el manifiesto pendiente cuando Flow confirma pago", async () => {
    pendingResources = [{ resource: "ebook:agentes-de-ia", amount: 10_000 }, { resource: "ebook:claude-nivel-experto", amount: 10_000 }];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 2, amount: 20_000, commerceOrder: "ebook-1" }) });
    await expect(getPurchasedBooksByToken("tok-pagado")).resolves.toEqual([
      { resource: "ebook:agentes-de-ia", title: "Agentes de IA para tu Negocio" },
      { resource: "ebook:claude-nivel-experto", title: "Claude a Nivel Experto" },
    ]);
  });

  it("completa un combo pagado aunque el webhook ya haya insertado sólo una compra", async () => {
    purchaseRows = [{ resource: "ebook:agentes-de-ia" }];
    pendingResources = [{ resource: "ebook:agentes-de-ia", amount: 10_000 }, { resource: "ebook:claude-nivel-experto", amount: 10_000 }];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 2, amount: 20_000, commerceOrder: "ebook-1" }) });
    const books = await getPurchasedBooksByToken("tok-combo-parcial");
    expect(books.map((book) => book.resource)).toEqual(["ebook:agentes-de-ia", "ebook:claude-nivel-experto"]);
  });

  it.each([
    { resources: [{ resource: "ebook:claude-nivel-experto", amount: 30_000 }] },
    { resources: [{ resource: "ebook:claude-nivel-experto", amount: "20000" }] },
    { resources: [{ resource: "ebook:no-existe", amount: 20_000 }] },
    { resources: [{ resource: "ebook:claude-nivel-experto", amount: 10_000 }, { resource: "ebook:claude-nivel-experto", amount: 10_000 }] },
    { resources: { resource: "ebook:claude-nivel-experto", amount: 20_000 } },
  ])("no amplía permisos con un manifiesto inválido: %j", async ({ resources }) => {
    purchaseRows = [{ resource: "ebook:agentes-de-ia" }];
    pendingResources = resources;
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 2, amount: 20_000, commerceOrder: "ebook-1" }) });
    expect((await getPurchasedBooksByToken("tok-pagado")).map((book) => book.resource)).toEqual(["ebook:agentes-de-ia"]);
  });
});
