import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ebook-delivery", () => ({ claimEbookDeliveries: vi.fn(), canSendEbookDelivery: vi.fn(), acceptEbookDelivery: vi.fn(), failEbookDelivery: vi.fn(), wasEbookDeliveryAccepted: vi.fn() }));
import { claimEbookDeliveries, canSendEbookDelivery, acceptEbookDelivery, failEbookDelivery, wasEbookDeliveryAccepted } from "@/lib/ebook-delivery";
import { deliverEbookOrders } from "@/lib/ebook-delivery-worker";
import { GET } from "@/app/api/cron/ebook-delivery/route";
const claim = { jobId: "11111111-1111-4111-8111-111111111111", flowOrder: "99", commerceOrder: "synthetic", payload: { from: "sender@example.test", to: "buyer@example.test", subject: "Frozen", html: "secret-link" }, idempotencyKey: "ebook-buyer-delivery/stable", leaseToken: "22222222-2222-4222-8222-222222222222", leaseExpiresAt: "2026-11-12T10:02:00Z", attempts: 1, firstAttemptAt: "2026-11-12T10:00:00Z" };
const request = vi.fn();
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
  vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", "true"); vi.stubEnv("EBOOK_DELIVERY_WORKER_ENABLED", "true"); vi.stubEnv("RESEND_API_KEY", "synthetic-key");
  vi.stubEnv("CRON_SECRET", "synthetic-cron"); vi.stubGlobal("fetch", request);
  vi.mocked(claimEbookDeliveries).mockResolvedValue([claim]); vi.mocked(canSendEbookDelivery).mockResolvedValue(true);
  vi.mocked(acceptEbookDelivery).mockResolvedValue(true); vi.mocked(failEbookDelivery).mockResolvedValue(true);
  vi.mocked(wasEbookDeliveryAccepted).mockResolvedValue(false); request.mockResolvedValue(Response.json({ id: "provider-id" }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("bounded ebook delivery worker", () => {
  it.each(["EBOOK_PAYMENT_FINALIZATION_ENABLED", "EBOOK_DELIVERY_WORKER_ENABLED"])("does nothing with %s absent", async (flag) => {
    vi.stubEnv(flag, ""); expect((await deliverEbookOrders()).enabled).toBe(false); expect(claimEbookDeliveries).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  });
  it("sends frozen payload/key once and acknowledges provider acceptance", async () => {
    expect(await deliverEbookOrders()).toMatchObject({ accepted: 1, claimed: 1 }); expect(claimEbookDeliveries).toHaveBeenCalledWith(2);
    expect(request).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST", body: JSON.stringify(claim.payload), signal: expect.any(AbortSignal), headers: expect.objectContaining({ "Idempotency-Key": claim.idempotencyKey }) }));
    expect(acceptEbookDelivery).toHaveBeenCalledWith(claim.jobId, claim.leaseToken, "provider-id"); expect(failEbookDelivery).not.toHaveBeenCalled();
  });
  // REST names/status codes from https://resend.com/docs/api-reference/errors
  it.each([[409, "concurrent_idempotent_requests", "provider_transient", "retry"], [409, "invalid_idempotent_request", "provider_rejected", "review"], [429, "rate_limit_exceeded", "provider_transient", "retry"], [503, "application_error", "provider_transient", "retry"], [422, "validation_error", "provider_rejected", "review"]])("classifies %s %s", async (status, name, failure, outcome) => {
    request.mockResolvedValue(Response.json({ name, message: "private recipient" }, { status: Number(status) }));
    expect(await deliverEbookOrders()).toMatchObject({ [outcome]: 1 }); expect(failEbookDelivery).toHaveBeenCalledWith(claim.jobId, claim.leaseToken, failure);
  });
  it("aborts transport with a 20-second signal and does not repeat HTTP", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(AbortSignal.abort());
    request.mockImplementation(async (_url, init) => { init.signal.throwIfAborted(); });
    expect(await deliverEbookOrders()).toMatchObject({ retry: 1 }); expect(timeout).toHaveBeenCalledWith(20_000); expect(request).toHaveBeenCalledTimes(1);
    expect(failEbookDelivery).toHaveBeenCalledWith(claim.jobId, claim.leaseToken, "provider_unknown"); timeout.mockRestore();
  });
  it("does not invent acceptance for success without ID", async () => {
    request.mockResolvedValue(Response.json({})); await deliverEbookOrders(); expect(acceptEbookDelivery).not.toHaveBeenCalled(); expect(failEbookDelivery).toHaveBeenCalled();
  });
  it.each([false, "throws"])("reads back uncertain ACK %s without send failure", async (ack) => {
    if (ack === false) vi.mocked(acceptEbookDelivery).mockResolvedValue(false); else vi.mocked(acceptEbookDelivery).mockRejectedValue(new Error("DB"));
    vi.mocked(wasEbookDeliveryAccepted).mockResolvedValue(true);
    expect(await deliverEbookOrders()).toMatchObject({ accepted: 1 }); expect(wasEbookDeliveryAccepted).toHaveBeenCalledWith(claim.jobId, "provider-id");
    expect(request).toHaveBeenCalledTimes(1); expect(failEbookDelivery).not.toHaveBeenCalled();
  });
  it("retains uncertainty if the lease expires during provider acceptance", async () => {
    request.mockImplementation(async () => { vi.setSystemTime(new Date("2026-11-12T10:03:00Z")); return Response.json({ id: "provider-id" }); });
    vi.mocked(acceptEbookDelivery).mockResolvedValue(false); expect(await deliverEbookOrders()).toMatchObject({ uncertain: 1 }); expect(failEbookDelivery).not.toHaveBeenCalled();
  });
  it("keeps payload and key stable on a later claimed retry", async () => {
    request.mockResolvedValueOnce(Response.json({ name: "concurrent_idempotent_requests" }, { status: 409 }));
    await deliverEbookOrders(); vi.mocked(claimEbookDeliveries).mockResolvedValue([{ ...claim, attempts: 2 }]); await deliverEbookOrders();
    expect(request.mock.calls[0][1].body).toBe(request.mock.calls[1][1].body);
    expect(request.mock.calls[0][1].headers["Idempotency-Key"]).toBe(request.mock.calls[1][1].headers["Idempotency-Key"]);
  });
  it("skips a lost lease", async () => {
    vi.mocked(canSendEbookDelivery).mockResolvedValue(false); expect(await deliverEbookOrders()).toMatchObject({ skipped: 1 }); expect(request).not.toHaveBeenCalled();
  });
  it("skips near the 23h cutoff", async () => {
    vi.mocked(claimEbookDeliveries).mockResolvedValue([{ ...claim, firstAttemptAt: "2026-11-11T11:00:10Z" }]); expect(await deliverEbookOrders()).toMatchObject({ skipped: 1 }); expect(request).not.toHaveBeenCalled();
  });
  it("rechecks cutoff after slow SQL", async () => {
    vi.mocked(canSendEbookDelivery).mockImplementation(async () => { vi.setSystemTime(new Date("2026-11-12T10:01:50Z")); return true; });
    expect(await deliverEbookOrders()).toMatchObject({ skipped: 1 }); expect(request).not.toHaveBeenCalled();
  });
  it("reports review at attempt five", async () => {
    vi.mocked(claimEbookDeliveries).mockResolvedValue([{ ...claim, attempts: 5 }]); request.mockRejectedValue(new Error("timeout")); expect(await deliverEbookOrders()).toMatchObject({ review: 1 });
  });
});
describe("cron authentication and privacy", () => {
  it("rejects missing auth before claiming", async () => {
    expect((await GET(new Request("https://example.test"))).status).toBe(401); expect(claimEbookDeliveries).not.toHaveBeenCalled();
  });
  it("fails closed without CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", ""); expect((await GET(new Request("https://example.test", { headers: { authorization: "Bearer " } }))).status).toBe(401);
  });
  it("returns only counters", async () => {
    const response = await GET(new Request("https://example.test", { headers: { authorization: "Bearer synthetic-cron" } }));
    const text = await response.text(); expect(text).not.toContain("secret-link"); expect(text).not.toContain("buyer@example.test"); expect(text).not.toContain("provider-id"); expect(response.status).toBe(200);
  });
});
