import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
vi.mock("@/lib/marketplace-seller-auth", () => ({ sellerIdentityFromRequest: vi.fn(), sellerMutationAllowed: vi.fn() }));

import { queryDatabase } from "@/lib/database";
import { sellerIdentityFromRequest, sellerMutationAllowed } from "@/lib/marketplace-seller-auth";
import { GET } from "../app/api/marketplace/seller/dashboard/route";
import { PATCH } from "../app/api/marketplace/seller/books/[id]/route";

const database = vi.mocked(queryDatabase);
const identity = vi.mocked(sellerIdentityFromRequest);
const mutationAllowed = vi.mocked(sellerMutationAllowed);
const sellerId = "11111111-1111-4111-8111-111111111111";
const bookId = "22222222-2222-4222-8222-222222222222";
const identityId = "33333333-3333-4333-8333-333333333333";

beforeEach(() => {
  database.mockReset();
  identity.mockReset().mockReturnValue(identityId);
  mutationAllowed.mockReset().mockReturnValue(true);
});

describe("panel real del autor", () => {
  it("rechaza identidad ausente antes de consultar datos", async () => {
    identity.mockReturnValue(null);
    const response = await GET(new Request("https://crececonia.cl/api/marketplace/seller/dashboard"));
    expect(response.status).toBe(401);
    expect(database).not.toHaveBeenCalled();
  });

  it("solo expone ventas pagadas del autor y no correos de compradores", async () => {
    database.mockResolvedValueOnce([{ id: sellerId, display_name: "Andrea", public_slug: "andrea", bio: "", status: "active" }]);
    database.mockResolvedValueOnce([]);
    database.mockResolvedValueOnce([]);
    database.mockResolvedValueOnce([{ sale_count: 2, gross_minor: "23800", commission_minor: "1190" }]);
    database.mockResolvedValueOnce([{ order_item_id: bookId, order_id: bookId, title: "IA para equipos", price_minor: "11900", commission_minor: "595", gateway_fee_actual_minor: null, paid_at: "2026-11-13T12:00:00Z" }]);
    const response = await GET(new Request("https://crececonia.cl/api/marketplace/seller/dashboard"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json();
    expect(body.salesSummary).toEqual({ sale_count: 2, gross_minor: "23800", commission_minor: "1190" });
    expect(body.recentSales).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("buyer_email");
    for (const [sql, params] of database.mock.calls.slice(3)) {
      expect(sql).toContain("i.seller_id = $1 and o.status = 'paid'");
      expect(params).toEqual([sellerId]);
      expect(sql).not.toContain("buyer_email");
    }
  });

  it("crea una revisión de borrador solo después de validar origen, identidad y derechos", async () => {
    database.mockResolvedValueOnce([{ revision_id: bookId }]);
    const request = new Request(`https://crececonia.cl/api/marketplace/seller/books/${bookId}`, {
      method: "PATCH", body: JSON.stringify({ title: "Libro corregido", description: "Una descripción suficientemente detallada", category: "ia", priceClp: 9900, declareRights: true }),
    });
    const response = await PATCH(request, { params: Promise.resolve({ id: bookId }) });
    expect(response.status).toBe(200);
    expect(database.mock.calls[0][0]).toContain("marketplace_edit_book_draft");
    expect(database.mock.calls[0][1]).toEqual([identityId, bookId, "Libro corregido", "Una descripción suficientemente detallada", "ia", 9900]);

    database.mockClear();
    mutationAllowed.mockReturnValue(false);
    expect((await PATCH(request, { params: Promise.resolve({ id: bookId }) })).status).toBe(403);
    expect(database).not.toHaveBeenCalled();
  });
});
