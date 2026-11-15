import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";

const requireAdminSession = vi.hoisted(() => vi.fn());
const queryDatabase = vi.hoisted(() => vi.fn());
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession }));
vi.mock("@/lib/marketplace-demo", () => ({ marketplaceDemoAvailable: () => false }));
vi.mock("@/lib/marketplace-review", () => ({
  listMarketplaceReviews: () => Promise.resolve([]),
  listSellerReviews: () => Promise.resolve([]),
  listMarketplaceReviewAssets: () => Promise.resolve([]),
}));
vi.mock("@/lib/database", () => ({ queryDatabase }));
vi.mock("@/app/admin/marketplace/FiscalEvidenceForm", () => ({ default: () => <span>Formulario tributario</span> }));
vi.mock("@/app/admin/marketplace/SettlementForm", () => ({ default: () => <span>Formulario liquidación</span> }));
vi.mock("@/app/admin/marketplace/RefundForm", () => ({ default: () => <span>Formulario reverso</span> }));
vi.mock("@/app/admin/marketplace/FeeEvidenceForm", () => ({ default: () => <span>Formulario tarifa</span> }));

import MarketplaceReviewPage from "@/app/admin/marketplace/page";

let orders: Record<string, unknown>[];

describe("operación administrativa del marketplace", () => {
  beforeEach(() => {
    requireAdminSession.mockReset().mockResolvedValue(undefined);
    orders = [{ id: "order", buyer_email: "comprador@example.cl", total_minor: "11900", status: "paid", created_at: "2026-11-15T12:00:00Z", paid_at: "2026-11-15T12:10:00Z", title: "Libro IA", seller_name: "Autora", payment_id: "payment", payment_status: "confirmed", gateway_fee_actual_minor: null, gateway_fee_reconciled: false, delivery_status: "succeeded", document_kind: null, document_reference: null }];
    queryDatabase.mockReset().mockImplementation(async (sql: string) => {
      if (sql.includes("as fiscal_pending")) return [{ sellers: "1", books: "1", buyers: "1", orders: "1", paid: "1", fiscal_pending: "1" }];
      if (sql.includes("from marketplace_sellers s")) return [{ id: "seller", email: "autor@example.cl", display_name: "Autora", public_slug: "autora", status: "active", created_at: "2026-11-15T12:00:00Z" }];
      if (sql.includes("from marketplace_orders o")) return orders;
      if (sql.includes("from public.marketplace_seller_payout_balances")) return [{ seller_id: "seller", display_name: "Autora", ledger_net_minor: "10955", settled_minor: "0", available_minor: "10955", blocked: false }];
      return [];
    });
  });

  it("exige sesión antes de consultar datos personales", async () => {
    requireAdminSession.mockRejectedValueOnce(new Error("sin sesión"));
    await expect(MarketplaceReviewPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("sin sesión");
    expect(queryDatabase).not.toHaveBeenCalled();
  });

  it("muestra contactos, ventas, estado de entrega y boleta manual", async () => {
    const page = await MarketplaceReviewPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html).toContain("autor@example.cl");
    expect(html).toContain("comprador@example.cl");
    expect(html).toContain("Libro IA");
    expect(html).toContain("Formulario tributario");
    expect(html).toContain("Formulario liquidación");
    expect(html).toContain("Formulario reverso");
    expect(html).toContain("Formulario tarifa");
    expect(html).toContain("Boletas pendientes");
    expect(queryDatabase.mock.calls.some(([sql]) => String(sql).includes("o.status in ('paid', 'refunded', 'disputed')") && String(sql).includes("o.paid_at is not null"))).toBe(true);
    expect(queryDatabase.mock.calls.some(([sql]) => String(sql).includes("aggregate_type='order'"))).toBe(true);
  });

  it("ofrece conciliación si la tarifa existe pero falta el asiento, incluso tras reembolso", async () => {
    orders = [{ ...orders[0], status: "refunded", payment_status: "refunded",
      gateway_fee_actual_minor: "390", gateway_fee_reconciled: false }];
    const html = renderToStaticMarkup(await MarketplaceReviewPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("asiento pendiente");
    expect(html).toContain("Formulario tarifa");
    expect(html).toContain("Formulario tributario");
    expect(html).not.toContain("Formulario reverso");
  });

  it("mantiene la barrera de boleta y tarifa en la vista de liquidación", () => {
    const sql = readFileSync(new URL("../database/migrations/20261116_003_marketplace_manual_settlement.up.sql", import.meta.url), "utf8");
    expect(sql).toContain("o.status in ('paid', 'refunded', 'disputed')");
    expect(sql).toContain("pay.status = case o.status when 'paid' then 'confirmed' else o.status end");
    expect(sql).toContain("public.marketplace_fiscal_evidence fiscal");
    expect(sql).toContain("fee.account_code = 'seller_payable'");
    expect(sql).toContain("fee.account_code = 'processor_clearing'");
  });
});
