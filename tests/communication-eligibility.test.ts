import { describe, expect, it } from "vitest";
import { evaluateCommunication, type CommunicationEligibilityInput } from "@/lib/communication-eligibility";
const verified: CommunicationEligibilityInput = { global: "allowed", consent: "granted", purchase: "not_applicable", frequency: "within_limit", deduplication: "new", campaignConfigured: true };
describe("communication simulation never authorizes transport", () => {
  it("even a fully verified synthetic candidate cannot send", () => {
    expect(evaluateCommunication(verified)).toEqual({ state: "eligible_for_simulation", reasons: [], canSend: false });
  });
  it("global withdrawal prevails over a scoped grant", () => {
    expect(evaluateCommunication({ ...verified, global: "suppressed" })).toMatchObject({ state: "excluded", reasons: ["global_suppression"], canSend: false });
  });
  it.each(["unknown", "missing", "suppressed"] as const)("does not infer a grant from historic data: %s", consent => {
    expect(evaluateCommunication({ ...verified, consent }).state).toBe("excluded");
  });
  it("distinguishes an acquired product from an unknown payment state", () => {
    expect(evaluateCommunication({ ...verified, purchase: "purchased" }).state).toBe("excluded");
    expect(evaluateCommunication({ ...verified, purchase: "unknown" })).toMatchObject({ state: "pending_verification", reasons: ["purchase_unknown"] });
    expect(evaluateCommunication(verified).state).toBe("eligible_for_simulation");
  });
  it("preserves all simultaneous blockers", () => {
    expect(evaluateCommunication({ ...verified, global: "suppressed", consent: "suppressed", frequency: "limit_reached", deduplication: "duplicate", campaignConfigured: false }).reasons)
      .toEqual(["global_suppression", "scope_suppression", "frequency_limit", "duplicate", "campaign_not_configured"]);
  });
  it("unknown frequency and duplicate history fail closed", () => {
    expect(evaluateCommunication({ ...verified, frequency: "unknown", deduplication: "unknown" }))
      .toMatchObject({ state: "pending_verification", reasons: ["frequency_unknown", "deduplication_unknown"], canSend: false });
  });
});
