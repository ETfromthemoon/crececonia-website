import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { queryDatabase } from "@/lib/database";
import { POST as claim } from "@/app/api/integrations/nitido/claim/route";
import { POST as ack } from "@/app/api/integrations/nitido/ack/route";

const key = "synthetic-nitido-key-not-a-secret-0123456789";
const workerId = "11111111-1111-4111-8111-111111111111";
const jobId = "22222222-2222-4222-8222-222222222222";
const leaseToken = "33333333-3333-4333-8333-333333333333";
const operationId = "44444444-4444-4444-8444-444444444444";
const makeRequest = (body: unknown, token: string | null = key) => new Request("https://www.crececonia.cl/api/integrations/nitido/claim", {
  method: "POST", headers: { ...(token === null ? {} : { authorization: `Bearer ${token}` }), "content-type": "application/json" },
  body: JSON.stringify(body),
});
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("NITIDO_SYNC_KEY", key); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("Nítido authentication and body boundary", () => {
  it.each([claim, ack])("disables endpoint when key is missing", async (post) => {
    vi.stubEnv("NITIDO_SYNC_KEY", "");
    vi.stubEnv("ADMIN_SECRET", key);
    const response = await post(makeRequest({ workerId, limit: 1 }));
    expect(response.status).toBe(503);
    expect(queryDatabase).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("rejects weak configured keys", async () => {
    vi.stubEnv("NITIDO_SYNC_KEY", "short");
    expect((await claim(makeRequest({}, "short"))).status).toBe(503);
  });
  it.each([null, "wrong", "x".repeat(4097)])("rejects absent/wrong/oversized credentials", async (token) => {
    expect((await claim(makeRequest({ workerId, limit: 1 }, token))).status).toBe(401);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("does not accept admin credentials or query keys", async () => {
    vi.stubEnv("ADMIN_SECRET", "other-admin-key");
    expect((await claim(makeRequest({ workerId, limit: 1 }, "other-admin-key"))).status).toBe(401);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("bounds body bytes even without content-length", async () => {
    expect((await claim(makeRequest({ workerId, limit: 1, extra: "x".repeat(2100) }))).status).toBe(413);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it.each([[], null, "text"])("rejects non-object JSON", async (body) => {
    expect((await claim(makeRequest(body))).status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON", async () => {
    const request = new Request("https://www.crececonia.cl/api/integrations/nitido/claim", { method: "POST", headers: { authorization: `Bearer ${key}` }, body: "{" });
    expect((await claim(request)).status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
});

describe("claim", () => {
  it("returns a bounded job from the atomic database claim", async () => {
    const job = { id: jobId, leaseToken, leaseExpiresAt: "2026-11-12T12:05:00Z", qualification: { id: workerId, name: "Synthetic" } };
    vi.mocked(queryDatabase).mockResolvedValue([{ job }]);
    const response = await claim(makeRequest({ workerId, limit: 1 }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ jobs: [job] });
    expect(queryDatabase).toHaveBeenCalledWith("select job from commerce.claim_nitido_sync_job($1::uuid)", [workerId]);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Vary")).toBe("Authorization");
  });
  it("returns an empty batch without claiming delivery", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    expect(await (await claim(makeRequest({ workerId, limit: 1 }))).json()).toEqual({ jobs: [] });
  });
  it.each([{ workerId, limit: 2 }, { workerId }, { workerId: "bad", limit: 1 }, { workerId, limit: 1, email: "unexpected@example.test" }])("rejects invalid claim %j", async (body) => {
    expect((await claim(makeRequest(body))).status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
});

describe("acknowledgment", () => {
  it("passes committed-receipt ID and lease to the atomic acknowledgment", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ outcome: "acknowledged" }]);
    const body = { jobId, leaseToken, outcome: "synced", operationId };
    expect(await (await ack(makeRequest(body))).json()).toEqual({ ok: true });
    expect(queryDatabase).toHaveBeenCalledWith(expect.stringContaining("commerce.ack_nitido_sync_job"), [jobId, leaseToken, "synced", operationId, null]);
  });
  it("allows quarantine without claiming a CRM operation", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ outcome: "acknowledged" }]);
    expect((await ack(makeRequest({ jobId, leaseToken, outcome: "needs_review", reasonCode: "duplicate_candidate" }))).status).toBe(200);
    expect(queryDatabase).toHaveBeenCalledWith(expect.any(String), [jobId, leaseToken, "needs_review", null, "duplicate_candidate"]);
  });
  it("surfaces expired/reassigned leases or incompatible replays", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([{ outcome: "conflict" }]);
    expect((await ack(makeRequest({ jobId, leaseToken, outcome: "synced", operationId }))).status).toBe(409);
  });
  it.each([
    { jobId, leaseToken, outcome: "synced" },
    { jobId, leaseToken, outcome: "synced", operationId, reasonCode: "duplicate_candidate" },
    { jobId, leaseToken, outcome: "needs_review", operationId, reasonCode: "duplicate_candidate" },
    { jobId, leaseToken, outcome: "needs_review", reasonCode: "private error message" },
    { jobId, leaseToken: "bad", outcome: "synced", operationId },
    { jobId, leaseToken, outcome: "failed", operationId },
  ])("rejects invalid ack %j", async (body) => {
    expect((await ack(makeRequest(body))).status).toBe(400);
    expect(queryDatabase).not.toHaveBeenCalled();
  });
  it("never treats an empty result as acknowledged", async () => {
    vi.mocked(queryDatabase).mockResolvedValue([]);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await ack(makeRequest({ jobId, leaseToken, outcome: "synced", operationId }))).status).toBe(503);
  });
});

it("redacts storage errors from responses and logs", async () => {
  vi.mocked(queryDatabase).mockRejectedValue(new Error("secret-key private@example.test SQL parameters"));
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const response = await claim(makeRequest({ workerId, limit: 1 }));
  expect(response.status).toBe(503);
  expect(await response.text()).not.toMatch(/secret-key|private@example|SQL/);
  expect(log.mock.calls.flat().join(" ")).not.toMatch(/secret-key|private@example|SQL/);
});
