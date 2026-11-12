import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
vi.mock("@/lib/ebook-delivery-email", () => ({ buildEbookDeliveryPayload: vi.fn(() => ({ from: "sender@example.test", to: "buyer@example.test", subject: "Frozen", html: "Frozen links" })) }));
import { queryDatabase } from "@/lib/database";
import { buildEbookDeliveryPayload } from "@/lib/ebook-delivery-email";
import { finalizeEbookPayment, isEbookFinalizationEnabled } from "@/lib/ebook-payment-finalization";

const jobId = "11111111-1111-4111-8111-111111111111";
const payment = { flowOrder: "9007199254740993", commerceOrder: "synthetic-order", email: "buyer@example.test", amount: 300, token: "new-token", source: "webhook" as const };
const items = [{ resource: "ebook:a", tier: "early", amount: 100 }, { resource: "ebook:b", tier: "regular", amount: 200 }];
const snapshot = { receipt: null, manifest: { resources: items, discount_code: null }, purchases: [] };
const receipt = { commerce_order: payment.commerceOrder, buyer_email: payment.email, paid_amount: payment.amount, job_id: jobId };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(queryDatabase).mockReset(); vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", "true"); });
afterEach(() => vi.unstubAllEnvs());

describe("dormant atomic ebook finalizer", () => {
  it.each([undefined, "false", "1"])("stays disabled for flag %s without querying SQL", async (flag) => {
    vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", flag);
    expect(isEbookFinalizationEnabled()).toBe(false);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("desactivada");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("finalizes through one transaction function with exact snapshot and frozen provider payload", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot }]).mockResolvedValueOnce([{ result: { outcome: "finalized", job_id: jobId } }]);
    await expect(finalizeEbookPayment(payment)).resolves.toEqual({ outcome: "finalized", jobId, resources: items.map((item) => item.resource), analytics: { distinctId: undefined, pricingVariant: undefined, discountCode: null } });
    const [sql, values] = vi.mocked(queryDatabase).mock.calls[1];
    expect(sql).toContain("commerce.finalize_ebook_payment");
    expect(values?.[0]).toBe(payment.flowOrder);
    expect(values?.[5]).toBe(JSON.stringify(snapshot));
    expect(buildEbookDeliveryPayload).toHaveBeenCalledWith({ email: payment.email, grants: items.map((item) => ({ resource: item.resource, token: payment.token })), recovery: false });
  });
  it("replays a receipt before requiring manifest or rebuilding changed catalog copy", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot: { receipt, manifest: null, purchases: [] } }]);
    await expect(finalizeEbookPayment(payment)).resolves.toEqual({ outcome: "existing", jobId });
    expect(buildEbookDeliveryPayload).not.toHaveBeenCalled();
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });
  it("rejects a receipt with a different verified payment identity", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot: { ...snapshot, receipt: { ...receipt, paid_amount: 1 } } }]);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("identidad");
    expect(buildEbookDeliveryPayload).not.toHaveBeenCalled();
  });
  it("preserves historical recovery tokens and uses new token only for missing grants", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot: { ...snapshot, purchases: [{ id: "synthetic", ...items[0], email: payment.email, token: "recovered-secret" }] } }])
      .mockResolvedValueOnce([{ result: { outcome: "finalized", job_id: jobId } }]);
    await finalizeEbookPayment({ ...payment, source: "recovery" });
    expect(buildEbookDeliveryPayload).toHaveBeenCalledWith({ email: payment.email, grants: [{ resource: "ebook:a", token: "recovered-secret" }, { resource: "ebook:b", token: payment.token }], recovery: true });
  });
  it("refreshes after a snapshot race and discovers the committed receipt", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot }]).mockResolvedValueOnce([{ result: { outcome: "snapshot_changed" } }])
      .mockResolvedValueOnce([{ snapshot: { ...snapshot, receipt } }]);
    await expect(finalizeEbookPayment(payment)).resolves.toEqual({ outcome: "existing", jobId });
    expect(queryDatabase).toHaveBeenCalledTimes(3);
  });
  it("bounds snapshot retries", async () => {
    vi.mocked(queryDatabase).mockImplementation(async (sql) => sql.includes("read_ebook") ? [{ snapshot }] : [{ result: { outcome: "snapshot_changed" } }]);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("cambió");
    expect(queryDatabase).toHaveBeenCalledTimes(6);
  });
  it.each([null, { resources: [...items, items[0]], discount_code: null }, { resources: [{ ...items[0], amount: 300.1 }], discount_code: null }])("rejects absent or inconsistent manifests", async (manifest) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot: { ...snapshot, manifest } }]);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("manifiesto");
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });
  it.each([{ email: "other@example.test" }, { amount: 101 }, { token: "" }, { resource: "ebook:extra" }])("rejects contradictory persisted grants", async (change) => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot: { ...snapshot, purchases: [{ id: "synthetic", ...items[0], email: payment.email, token: "existing", ...change }] } }]);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("revisión");
    expect(queryDatabase).toHaveBeenCalledTimes(1);
  });
  it("does not leak database recipient or token details", async () => {
    vi.mocked(queryDatabase).mockRejectedValue(new Error("buyer@example.test secret-token"));
    await expect(finalizeEbookPayment(payment)).rejects.toThrow(/^No se pudo finalizar la compra de ebooks\.$/);
  });
  it.each(["0", "1.1", "9223372036854775808"])("rejects invalid bigint order %s", async (flowOrder) => {
    await expect(finalizeEbookPayment({ ...payment, flowOrder })).rejects.toThrow("inválido");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("requires an explicit transactional result", async () => {
    vi.mocked(queryDatabase).mockResolvedValueOnce([{ snapshot }]).mockResolvedValueOnce([]);
    await expect(finalizeEbookPayment(payment)).rejects.toThrow("no confirmó");
  });
});
