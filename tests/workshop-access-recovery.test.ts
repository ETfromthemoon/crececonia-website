import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockSend } = vi.hoisted(() => ({ mockRpc: vi.fn(), mockSend: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/workshop-delivery-email", () => ({ sendWorkshopFollowUpEmail: mockSend }));

import { POST } from "@/app/api/workshop/access/recover/route";

const request = (email: unknown) => new Request("https://crececonia.cl/api/workshop/access/recover", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
});

describe("POST /api/workshop/access/recover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockSend.mockResolvedValue("resend-access-1");
  });

  it("envía un enlace personal y registra el id del proveedor", async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ recovery_id: "recovery-1", commerce_order: "workshop-123-abcdef", email: "alumno@test.com" }], error: null });
    const response = await POST(request(" Alumno@Test.com "));
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenNthCalledWith(1, "claim_workshop_access_recovery", expect.objectContaining({ p_email: "alumno@test.com" }));
    expect(mockSend).toHaveBeenCalledWith({ email: "alumno@test.com", orderId: "workshop-123-abcdef" });
    expect(mockRpc).toHaveBeenCalledWith("complete_workshop_access_recovery", { p_recovery_id: "recovery-1", p_provider_message_id: "resend-access-1" });
  });

  it("no revela si el correo no tiene una compra", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });
    const response = await POST(request("nadie@test.com"));
    expect(response.status).toBe(200);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("registra fallos de Resend sin revelar datos al visitante", async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ recovery_id: "recovery-2", commerce_order: "workshop-123-abcdef", email: "alumno@test.com" }], error: null });
    mockSend.mockRejectedValueOnce(new Error("Resend timeout"));
    const response = await POST(request("alumno@test.com"));
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("fail_workshop_access_recovery", { p_recovery_id: "recovery-2", p_error: "Resend timeout" });
  });

  it("rechaza un formato de correo inválido", async () => {
    const response = await POST(request("no-es-correo"));
    expect(response.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
