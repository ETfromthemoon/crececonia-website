import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import { loadEbookReconciliationReport, reconciliationLabel, type ReconciliationCategory } from "@/lib/admin-ebook-reconciliation";

const schema = { purchases: true, receipts: true, jobs: true, purchaseFlowOrder: true, purchasePurchasedAt: true, purchaseId: true, now: new Date("2026-11-12T18:00:00Z") };
const categories: ReconciliationCategory[] = ["historical_unlinked", "job_without_receipt", "receipt_without_job", "receipt_job_mismatch",
  "delivery_pending", "delivery_needs_review", "provider_accepted", "receipt_without_purchase", "job_without_purchase", "purchase_without_flow_order"];
const counts = Object.fromEntries(categories.map(category => [category, "0"]));
const order = "9007199254740993";
const sample = { flow_order: order, observed_at: "2026-11-12T17:00:00.123456Z", resource_count: 2,
  category: "receipt_job_mismatch", delivery_status: "pending" };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(requireAdminSession).mockResolvedValue(undefined);
  process.env.ADMIN_SECRET = "reconciliation-test-secret";
});

describe("read-only ebook reconciliation", () => {
  it("authenticates before reading database schema", async () => {
    vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
    await expect(loadEbookReconciliationReport()).rejects.toThrow("redirect");
    expect(queryDatabase).not.toHaveBeenCalled();
  });

  it("reports missing purchase schema as unavailable with no invented zero counts", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...schema, purchases: false, purchaseFlowOrder: false, purchasePurchasedAt: false, purchaseId: false }]);
    const report = await loadEbookReconciliationReport();
    expect(report.schema).toBe("unavailable");
    expect(report.unavailableReason).toBe("purchase_schema_missing");
    expect(report.counts).toBeNull();
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ ...schema, receipts: false, jobs: false }, "durable_schema_absent"],
    [{ ...schema, receipts: true, jobs: false }, "durable_schema_partial"],
    [{ ...schema, receipts: false, jobs: true }, "durable_schema_partial"],
  ] as const)("does not report legacy-only or partial durable schema as zero incidents", async (partial, reason) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([partial]);
    const report = await loadEbookReconciliationReport();
    expect(report).toMatchObject({ schema: "unavailable", unavailableReason: reason, counts: null, cases: [] });
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });

  it("classifies unlinked paid orders as uncertain, not as missing delivery", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([
      { counts: { ...counts, historical_unlinked: "7", purchase_without_flow_order: "3" }, cases: [{ ...sample, category: "historical_unlinked", delivery_status: null }], has_more: false },
    ]);
    const report = await loadEbookReconciliationReport();
    expect(report.schema).toBe("complete");
    if (report.schema !== "complete") throw new Error("expected complete report");
    expect(report.counts.historical_unlinked).toBe(7);
    expect(report.counts.purchase_without_flow_order).toBe(3);
    expect(report.cases[0].category).toBe("historical_unlinked");
    expect(reconciliationLabel(report.cases[0].category).guidance).toContain("No demuestra que falte un correo");
  });

  it("identifies mismatched receipts/jobs without returning provider IDs or personal delivery data", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([
      { counts: { ...counts, receipt_job_mismatch: "1" }, cases: [sample], has_more: false },
    ]);
    const report = await loadEbookReconciliationReport();
    expect(report.schema).toBe("complete");
    if (report.schema !== "complete") throw new Error("expected complete report");
    const row = report.cases[0];
    expect(row).toMatchObject({ category: "receipt_job_mismatch", resourceCount: 2, deliveryStatus: "pending" });
    expect(row.reference).toMatch(/^ord-[a-f0-9]{16}$/);
    expect(JSON.stringify(report)).not.toContain(order);
    const sql = vi.mocked(queryDatabase).mock.calls[1][0];
    expect(sql).toContain("from commerce.ebook_payment_finalizations");
    expect(sql).toContain("from commerce.ebook_delivery_jobs");
    expect(sql).toContain("purchase_without_flow_order");
    expect(sql).not.toMatch(/\b(email|buyer_email|payload|grants|token|lease_token|provider_message_id)\b/i);
    expect(sql).not.toMatch(/\b(insert|update|delete|truncate)\b/i);
  });

  it("caps the detail projection while preserving totals for the full history", async () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({ ...sample, flow_order: String(1000 + index) }));
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([
      { counts: { ...counts, historical_unlinked: "99" }, cases: rows, has_more: true },
    ]);
    const report = await loadEbookReconciliationReport();
    expect(report.schema).toBe("complete");
    if (report.schema !== "complete") throw new Error("expected complete report");
    expect(report.counts.historical_unlinked).toBe(99);
    expect(report.cases).toHaveLength(25);
    expect(report.hasMore).toBe(true);
    expect(vi.mocked(queryDatabase).mock.calls[1][0]).toContain("limit 26");
  });

  it("fails closed on malformed report rows rather than showing misleading state", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([
      { counts: { ...counts, historical_unlinked: "not-a-count" }, cases: [], has_more: false },
    ]);
    await expect(loadEbookReconciliationReport()).rejects.toThrow("Invalid reconciliation count");
  });
});
