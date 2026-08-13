import { beforeEach, describe, expect, it, vi } from "vitest";

let purchaseRows: Array<{ resource: string }> = [];
let pendingResources: Array<{ resource: string }> | null = null;

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

  it("devuelve compras ya registradas sin volver a consultar Flow", async () => {
    purchaseRows = [{ resource: "ebook:agentes-de-ia" }];
    await expect(getPurchasedBooksByToken("tok-1")).resolves.toEqual([
      { resource: "ebook:agentes-de-ia", title: "Agentes de IA para tu Negocio" },
    ]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("no autoriza una orden pendiente si Flow aún no la acredita", async () => {
    pendingResources = [{ resource: "ebook:agentes-de-ia" }];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 1, commerceOrder: "ebook-1" }) });
    await expect(getPurchasedBooksByToken("tok-pendiente")).resolves.toEqual([]);
  });

  it("autoriza exactamente el manifiesto pendiente cuando Flow confirma pago", async () => {
    pendingResources = [{ resource: "ebook:agentes-de-ia" }, { resource: "ebook:claude-nivel-experto" }];
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ status: 2, commerceOrder: "ebook-1" }) });
    await expect(getPurchasedBooksByToken("tok-pagado")).resolves.toEqual([
      { resource: "ebook:agentes-de-ia", title: "Agentes de IA para tu Negocio" },
      { resource: "ebook:claude-nivel-experto", title: "Claude a Nivel Experto" },
    ]);
  });
});
