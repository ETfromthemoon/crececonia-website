import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import { loadCommunicationSimulation } from "@/lib/admin-communication-simulation";
const schema = { contacts: true, preferences: true, events: true, subscribers: true, waitlist: true };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(requireAdminSession).mockResolvedValue(undefined); });
it("authenticates before schema or source queries", async () => {
  vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
  await expect(loadCommunicationSimulation()).rejects.toThrow("redirect"); expect(queryDatabase).not.toHaveBeenCalled();
});
it.each([[false, false, false, "absent"], [true, false, true, "partial"]])("does not read incomplete registry", async (contacts, preferences, events, state) => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...schema, contacts, preferences, events }])
    .mockResolvedValue([{ global_state: "unknown", consent_state: "unknown", count: "4" }]);
  const report = await loadCommunicationSimulation(); expect(report.schema).toBe(state);
  expect(report.cohorts[0]).toMatchObject({ total: 4, excluded: 4, reasons: { consent_unknown: 4 } });
  for (const [sql] of vi.mocked(queryDatabase).mock.calls.slice(1)) expect(sql).not.toContain("join commerce.communication");
});
it("reports missing sources rather than inventing zero", async () => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ ...schema, subscribers: false, waitlist: false }]);
  expect(await loadCommunicationSimulation()).toMatchObject({ missingSources: ["newsletter", "launch_notice"], cohorts: [], canSend: false });
  expect(queryDatabase).toHaveBeenCalledTimes(1);
});
it("returns only aggregates with separate scope, never recipient data or sendable jobs", async () => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([
    { global_state: "suppressed", consent_state: "granted", count: "2", email: "private@example.test" },
    { global_state: "unknown", consent_state: "unknown", count: "3" },
  ]).mockResolvedValueOnce([{ global_state: "allowed", consent_state: "granted", count: "1" }]);
  const report = await loadCommunicationSimulation();
  expect(report.cohorts[0]).toMatchObject({ total: 5, excluded: 5, pending: 0, reasons: { global_suppression: 2, consent_unknown: 3, campaign_not_configured: 5 } });
  expect(report.cohorts[1]).toMatchObject({ total: 1, pending: 1, reasons: { purchase_unknown: 1 } });
  expect(report.cohorts[0].reasons.purchase_unknown).toBeUndefined();
  expect(JSON.stringify(report)).not.toContain("private");
  const calls = vi.mocked(queryDatabase).mock.calls.slice(1);
  expect(calls.map(([, values]) => values)).toEqual([["newsletter"], ["launch_notice"]]);
  for (const [sql] of calls) {
    expect(sql).not.toMatch(/\b(insert|update|delete)\b/i);
    expect(sql).toContain("f.revision > c.last_suppressed_revision");
    expect(sql).toContain("f.resource = p.resource");
    expect(sql).toContain("count(*)::text");
  }
});
it.each(["9007199254740992", "-1", "1.5", 1])("rejects invalid aggregate %s", async count => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ global_state: "allowed", consent_state: "granted", count }]);
  await expect(loadCommunicationSimulation()).rejects.toThrow("Invalid aggregate");
});
it("fails instead of treating a query error as no recipients", async () => {
  vi.mocked(queryDatabase).mockRejectedValue(new Error("offline")); await expect(loadCommunicationSimulation()).rejects.toThrow("offline");
});
it("rejects an unrecognized preference state", async () => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([schema]).mockResolvedValueOnce([{ global_state: "unexpected", consent_state: "granted", count: "1" }]);
  await expect(loadCommunicationSimulation()).rejects.toThrow("Invalid preference aggregate");
});
it.each(["global_state", "consent_state"] as const)("rejects coerced arrays and objects in %s", async field => {
  for (const value of [["suppressed"], { toString: () => "suppressed" }]) {
    vi.mocked(queryDatabase).mockReset().mockResolvedValueOnce([schema]).mockResolvedValueOnce([
      { global_state: "allowed", consent_state: "granted", count: "1", [field]: value },
    ]);
    await expect(loadCommunicationSimulation()).rejects.toThrow("Invalid preference aggregate");
    expect(queryDatabase).toHaveBeenCalledTimes(2);
  }
});
