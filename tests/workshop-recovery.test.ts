import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendRecovery, mockRpc } = vi.hoisted(() => ({
  mockSendRecovery: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/workshop-recovery-email", () => ({
  sendWorkshopRecoveryEmail: mockSendRecovery,
  WorkshopRecoveryRecipientError: class WorkshopRecoveryRecipientError extends Error {},
}));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));

import { deliverWorkshopCheckoutRecoveries } from "@/lib/workshop-recovery";
import { WorkshopRecoveryRecipientError } from "@/lib/workshop-recovery-email";

describe("deliverWorkshopCheckoutRecoveries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendRecovery.mockResolvedValue("resend-recovery-1");
    mockRpc.mockImplementation((name: string) => {
      if (name === "claim_workshop_checkout_recoveries") return Promise.resolve({ data: [{
        recovery_id: "recovery-1",
        email: "persona@test.com",
        original_amount: 20_000,
        discounted_amount: 18_000,
      }], error: null });
      return Promise.resolve({ data: true, error: null });
    });
  });

  it("envía una sola recuperación con el 10% y registra el mensaje", async () => {
    await expect(deliverWorkshopCheckoutRecoveries()).resolves.toEqual({ sentCount: 1, failedCount: 0, suppressedCount: 0 });
    expect(mockSendRecovery).toHaveBeenCalledWith(expect.objectContaining({
      email: "persona@test.com",
      originalAmount: 20_000,
      discountedAmount: 18_000,
      recoveryUrl: expect.stringContaining("/api/workshop/recover?token="),
    }));
    expect(mockRpc).toHaveBeenCalledWith("complete_workshop_checkout_recovery", expect.objectContaining({
      p_recovery_id: "recovery-1",
      p_provider_message_id: "resend-recovery-1",
      p_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("marca el intento fallido para reintentarlo en el próximo ciclo", async () => {
    mockSendRecovery.mockRejectedValueOnce(new Error("Resend timeout"));
    await expect(deliverWorkshopCheckoutRecoveries()).resolves.toEqual({ sentCount: 0, failedCount: 1, suppressedCount: 0 });
    expect(mockRpc).toHaveBeenCalledWith("fail_workshop_checkout_recovery", {
      p_recovery_id: "recovery-1",
      p_error: "Resend timeout",
    });
  });

  it("suprime un destinatario rechazado para no reintentarlo indefinidamente", async () => {
    mockSendRecovery.mockRejectedValueOnce(new WorkshopRecoveryRecipientError("Invalid `to` field."));
    await expect(deliverWorkshopCheckoutRecoveries()).resolves.toEqual({ sentCount: 0, failedCount: 0, suppressedCount: 1 });
    expect(mockRpc).toHaveBeenCalledWith("suppress_workshop_checkout_recovery", {
      p_recovery_id: "recovery-1",
      p_error: "Invalid `to` field.",
    });
  });
});
