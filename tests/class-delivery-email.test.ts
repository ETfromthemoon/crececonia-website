import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, rpc } = vi.hoisted(() => ({ send: vi.fn(), rpc: vi.fn() }));
vi.mock("resend", () => ({ Resend: class { emails = { send }; } }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc }) }));
vi.mock("@/lib/class-hub-access", () => ({ createClassHubToken: () => "test-token" }));

import { sendClassAccessEmail, sendClassFollowUpEmail, sendClassHubAccessEmail, sendClassOrganizerReminder, sendClassSessionEmail } from "@/lib/class-delivery-email";
import { deliverClassOrders } from "@/lib/class-delivery";

const senders = [
  ["access", () => sendClassAccessEmail({ email: "buyer@example.test", offerLabel: "Early", amount: 100, orderId: "test-order" })],
  ["hub", () => sendClassHubAccessEmail({ email: "buyer@example.test", orderId: "test-order" })],
  ["session", () => sendClassSessionEmail({ email: "buyer@example.test", timing: "1h" })],
  ["follow-up", () => sendClassFollowUpEmail({ email: "buyer@example.test", orderId: "test-order" })],
  ["organizer", () => sendClassOrganizerReminder({ timing: "1h", paidCount: 1, sentCount: 1, sessionReady: true })],
] as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CLASS_SESSION_URL", "https://example.test/meeting");
});

afterEach(() => vi.unstubAllEnvs());

describe.each(senders)("class email %s", (_name, deliver) => {
  it("rejects a resolved provider error", async () => {
    send.mockResolvedValue({ data: null, error: { message: "Rejected" } });
    await expect(deliver()).rejects.toThrow("Rejected");
  });
  it("rejects a response without a provider message ID", async () => {
    send.mockResolvedValue({ data: {}, error: null });
    await expect(deliver()).rejects.toThrow("Resend no confirmó");
  });
  it("propagates a transport failure", async () => {
    send.mockRejectedValue(new Error("Network unavailable"));
    await expect(deliver()).rejects.toThrow("Network unavailable");
  });
  it("completes only after provider acceptance", async () => {
    send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
    await expect(deliver()).resolves.toBeUndefined();
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe("class delivery job and real email wrapper", () => {
  beforeEach(() => {
    rpc.mockImplementation(async (name: string) => ({
      data: name === "claim_class_delivery" ? [{ event_id: "event-1", commerce_order: "order-1", email: "buyer@example.test", offer_label: "Early", amount_minor: 100, flow_token: null }] : null,
      error: null,
    }));
  });
  it("records failure instead of completing a rejected message", async () => {
    send.mockResolvedValue({ data: null, error: { message: "Rejected" } });
    await expect(deliverClassOrders("welcome")).rejects.toThrow("Rejected");
    expect(rpc).toHaveBeenCalledWith("fail_class_delivery", { p_event_id: "event-1", p_error: "Rejected" });
    expect(rpc.mock.calls.some(([name]) => name === "complete_class_delivery")).toBe(false);
  });
  it("completes the job after provider acceptance", async () => {
    send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
    await expect(deliverClassOrders("welcome")).resolves.toEqual({ sentCount: 1 });
    expect(rpc).toHaveBeenCalledWith("complete_class_delivery", { p_event_id: "event-1" });
    expect(rpc.mock.calls.some(([name]) => name === "fail_class_delivery")).toBe(false);
  });
});
