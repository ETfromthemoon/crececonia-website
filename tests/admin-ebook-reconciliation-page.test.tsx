import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
vi.mock("server-only", () => ({}));
import { requireAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import Page from "@/app/admin/ebook/conciliacion/page";

const categories = ["historical_unlinked", "job_without_receipt", "receipt_without_job", "receipt_job_mismatch",
  "delivery_pending", "delivery_needs_review", "provider_accepted", "receipt_without_purchase", "job_without_purchase", "purchase_without_flow_order"];
const completeSchema = { purchases: true, receipts: true, jobs: true, purchaseFlowOrder: true, purchasePurchasedAt: true, purchaseId: true, now: new Date("2026-11-12T18:00:00Z") };
const counts = Object.fromEntries(categories.map(category => [category, "0"]));
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("React", React); vi.mocked(requireAdminSession).mockResolvedValue(undefined); process.env.ADMIN_SECRET = "reconciliation-test-secret"; });

describe("reconciliation page", () => {
  it("keeps session redirect outside the report error boundary", async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
    await expect(Page()).rejects.toThrow("redirect");
    expect(queryDatabase).not.toHaveBeenCalled();
  });

  it("labels absent durable infrastructure not verifiable rather than zero incidents", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...completeSchema, receipts: false, jobs: false }]);
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Estado no verificable");
    expect(html).toContain("no equivale a cero compras ni a cero correos pendientes");
    expect(html).not.toContain("0</p>");
  });

  it("renders only safe pseudonymous cases and makes the read-only limit explicit", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([completeSchema]).mockResolvedValueOnce([{
      counts: { ...counts, receipt_job_mismatch: "1", provider_accepted: "1" },
      cases: [
        { flow_order: "9007199254740993", observed_at: "2026-11-12T17:00:00.123456Z", resource_count: 2, category: "receipt_job_mismatch", delivery_status: "pending" },
        { flow_order: "9876543210123456", observed_at: "2026-11-12T16:00:00.123456Z", resource_count: 1, category: "provider_accepted", delivery_status: "provider_accepted" },
      ], has_more: false,
    }]);
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Conciliación de compras y entregas");
    expect(html).toContain("ord-");
    expect(html).toContain("No reintenta trabajos ni envía correos");
    expect(html).toContain("no acredita llegada a la bandeja ni descarga");
    expect(html).not.toContain("9007199254740993");
    expect(html).not.toContain("9876543210123456");
    expect(html).not.toContain("buyer_email");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<button");
  });

  it("does not convert DB errors into an empty reconciliation", async () => {
    vi.mocked(queryDatabase).mockRejectedValue(new Error("private-db-error"));
    const html = renderToStaticMarkup(await Page());
    expect(html).toContain("Conciliación no disponible");
    expect(html).not.toContain("private-db-error");
    expect(html).not.toContain("No se encontraron órdenes");
  });
});
