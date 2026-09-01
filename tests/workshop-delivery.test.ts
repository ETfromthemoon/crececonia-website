import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPurchaseNotice, mockRpc } = vi.hoisted(() => ({
  mockPurchaseNotice: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/purchase-notification-email", () => ({ sendPurchaseNotification: mockPurchaseNotice }));
vi.mock("@/lib/ebook-delivery-email", () => ({ sendEbookDeliveryEmail: vi.fn() }));
vi.mock("@/lib/workshop-delivery-email", () => ({
  sendWorkshopFollowUpEmail: vi.fn(),
  sendWorkshopSessionEmail: vi.fn(),
  sendWorkshopWelcomeEmail: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));

import { deliverWorkshopOrders } from "@/lib/workshop-delivery";

describe("deliverWorkshopOrders admin-notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPurchaseNotice.mockResolvedValue("resend-message-1");
    mockRpc.mockImplementation((name: string) => {
      if (name === "claim_workshop_delivery") return Promise.resolve({
        data: [{
          event_id: "event-1",
          commerce_order: "workshop-order-1",
          email: "comprador@test.com",
          amount_minor: 20_000,
        }],
        error: null,
      });
      return Promise.resolve({ data: true, error: null });
    });
  });

  it("registra como enviada la notificación interna con el id de Resend", async () => {
    await expect(deliverWorkshopOrders("admin-notification", "workshop-order-1"))
      .resolves.toEqual({ sentCount: 1 });

    expect(mockPurchaseNotice).toHaveBeenCalledWith(expect.objectContaining({
      kind: "Workshop en vivo",
      buyerEmail: "comprador@test.com",
      amount: 20_000,
      orderId: "workshop-order-1",
    }));
    expect(mockRpc).toHaveBeenCalledWith("complete_workshop_delivery", {
      p_event_id: "event-1",
      p_provider_message_id: "resend-message-1",
    });
  });

  it("marca el evento como fallido para que el próximo webhook lo reintente", async () => {
    mockPurchaseNotice.mockRejectedValueOnce(new Error("Resend timeout"));

    await expect(deliverWorkshopOrders("admin-notification", "workshop-order-1"))
      .rejects.toThrow("Resend timeout");
    expect(mockRpc).toHaveBeenCalledWith("fail_class_delivery", {
      p_event_id: "event-1",
      p_error: "Resend timeout",
    });
  });
});
