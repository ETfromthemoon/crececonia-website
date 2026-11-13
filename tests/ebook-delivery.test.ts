import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { queryDatabase } from "@/lib/database";
import { acceptEbookDelivery, canSendEbookDelivery, wasEbookDeliveryAccepted, claimEbookDeliveries, enqueueEbookDelivery, failEbookDelivery, type EbookDeliveryFailure } from "@/lib/ebook-delivery";

const jobId = "11111111-1111-4111-8111-111111111111";
const leaseToken = "22222222-2222-4222-8222-222222222222";
const message = { from: "CrececonIA <sender@example.test>", to: "buyer@example.test", subject: "Tus ebooks", html: '<a href="https://example.test/private?token=synthetic">Descargar</a>' };
const input = { flowOrder: "9007199254740993", commerceOrder: "synthetic-order", payload: message };
const row = {
  job_id: jobId, flow_order: input.flowOrder, commerce_order: input.commerceOrder, payload: message,
  idempotency_key: `ebook-buyer-delivery/${jobId}`, lease_token: leaseToken,
  lease_expires_at: "2026-11-12T10:02:00Z", attempts: 1, first_attempt_at: "2026-11-12T10:00:00Z",
};
beforeEach(() => vi.resetAllMocks());

describe("ebook delivery repository", () => {
  it("validates lease and replay headroom with database clock before sending", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ ready: false }]);
    await expect(canSendEbookDelivery(jobId, leaseToken)).resolves.toBe(false);
    const [sql, values] = vi.mocked(queryDatabase).mock.calls[0];
    expect(values).toEqual([jobId, leaseToken]); expect(sql).toContain("clock_timestamp()"); expect(sql).toContain("23 hours"); expect(sql).toContain("25 seconds");
  });
  it("readback confirms the same provider ID and exposes only a boolean", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ accepted: true }]);
    await expect(wasEbookDeliveryAccepted(jobId, "provider-id")).resolves.toBe(true);
    expect(vi.mocked(queryDatabase).mock.calls[0][1]).toEqual([jobId, "provider-id"]);
  });
  it("enqueues a frozen provider payload without lossy bigint conversion", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ job_id: jobId, outcome: "enqueued" }]);
    await expect(enqueueEbookDelivery(input)).resolves.toEqual({ jobId, outcome: "enqueued" });
    expect(vi.mocked(queryDatabase).mock.calls[0][1]).toEqual([input.flowOrder, input.commerceOrder, JSON.stringify(message)]);
  });
  it("acknowledges an identical enqueue retry", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ job_id: jobId, outcome: "existing" }]);
    await expect(enqueueEbookDelivery(input)).resolves.toEqual({ jobId, outcome: "existing" });
  });
  it.each(["0", "-1", "1.5", "9223372036854775808", "1; delete"]) ("rejects invalid order %s before SQL", async (flowOrder) => {
    await expect(enqueueEbookDelivery({ ...input, flowOrder })).rejects.toThrow("Orden");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("does not silently discard provider fields", async () => {
    await expect(enqueueEbookDelivery({ ...input, payload: { ...message, cc: "someone@example.test" } as typeof message })).rejects.toThrow("Contenido");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("rejects an empty or invalid recipient before SQL", async () => {
    await expect(enqueueEbookDelivery({ ...input, payload: { ...message, to: "" } })).rejects.toThrow("Contenido");
    await expect(enqueueEbookDelivery({ ...input, payload: { ...message, to: "not-an-email" } })).rejects.toThrow("Contenido");
  });
  it("does not leak database error details or private download links", async () => {
    vi.mocked(queryDatabase).mockRejectedValue(new Error(JSON.stringify(message)));
    await expect(enqueueEbookDelivery(input)).rejects.toThrow("No se pudo actualizar la cola");
  });
  it("requires an explicit enqueue acknowledgment", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    await expect(enqueueEbookDelivery(input)).rejects.toThrow("no confirmó");
  });
  it("claims the persisted payload, stable key and ownership token", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([row]);
    const [claim] = await claimEbookDeliveries(2);
    expect(claim).toMatchObject({ jobId, leaseToken, payload: message, flowOrder: input.flowOrder, idempotencyKey: row.idempotency_key });
    expect(vi.mocked(queryDatabase).mock.calls[0][1]).toEqual([2]);
  });
  it.each([0, 51, 1.5])("rejects unbounded claim size %s", async (limit) => {
    await expect(claimEbookDeliveries(limit)).rejects.toThrow("Límite");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it.each([
    [new Date("2026-11-12T10:02:00.123Z"), new Date("2026-11-12T10:00:00.456Z")],
    ["2026-11-12T07:02:00.123-03:00", "2026-11-12T07:00:00.456-03:00"],
  ])("normalizes driver timestamps to ISO strings", async (leaseExpiresAt, firstAttemptAt) => {
    vi.mocked(queryDatabase).mockResolvedValue([{ ...row, lease_expires_at: leaseExpiresAt, first_attempt_at: firstAttemptAt }]);
    const [claim] = await claimEbookDeliveries();
    expect(claim.leaseExpiresAt).toBe("2026-11-12T10:02:00.123Z");
    expect(claim.firstAttemptAt).toBe("2026-11-12T10:00:00.456Z");
  });
  it.each(["lease_expires_at", "first_attempt_at"])("rejects invalid %s timestamps", async (field) => {
    for (const invalid of [new Date(NaN), "invalid", null]) {
      vi.mocked(queryDatabase).mockResolvedValue([{ ...row, [field]: invalid }]);
      await expect(claimEbookDeliveries()).rejects.toThrow("inválida");
    }
  });
  it("returns no jobs without inventing a delivery", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    await expect(claimEbookDeliveries()).resolves.toEqual([]);
  });
  it("rejects inconsistent provider identity", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ ...row, idempotency_key: "another-key" }]);
    await expect(claimEbookDeliveries()).rejects.toThrow("inválida");
  });
  it("fences completion using the exact lease token", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ accepted: true }]);
    await expect(acceptEbookDelivery(jobId, leaseToken, "provider-id")).resolves.toBe(true);
    expect(vi.mocked(queryDatabase).mock.calls[0][1]).toEqual([jobId, leaseToken, "provider-id"]);
  });
  it("preserves a lost-lease response rather than inventing success", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ accepted: false }]);
    await expect(acceptEbookDelivery(jobId, leaseToken, "provider-id")).resolves.toBe(false);
  });
  it("requires a provider ID before accepting", async () => {
    await expect(acceptEbookDelivery(jobId, leaseToken, " ")).rejects.toThrow("proveedor");
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("sanitizes unknown failure details before SQL", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ failed: true }]);
    await expect(failEbookDelivery(jobId, leaseToken, "buyer@example.test token=private" as EbookDeliveryFailure)).resolves.toBe(true);
    expect(vi.mocked(queryDatabase).mock.calls[0][1]).toEqual([jobId, leaseToken, "provider_unknown"]);
  });
  it("preserves the lost-lease response for failure", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ failed: false }]);
    await expect(failEbookDelivery(jobId, leaseToken, "provider_transient")).resolves.toBe(false);
  });
  it("rejects missing result acknowledgments", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    await expect(acceptEbookDelivery(jobId, leaseToken, "provider-id")).rejects.toThrow("no confirmó");
    await expect(failEbookDelivery(jobId, leaseToken, "provider_unknown")).rejects.toThrow("no confirmó");
  });
});
