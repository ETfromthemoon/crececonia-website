import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockDeliver, mockLate, mockReadiness } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockDeliver: vi.fn(),
  mockLate: vi.fn(),
  mockReadiness: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/workshop-delivery", () => ({ deliverWorkshopOrders: mockDeliver, deliverLateWorkshopAccessIfNeeded: mockLate }));
vi.mock("@/lib/workshop-readiness", () => ({ getWorkshopFulfillmentReadiness: mockReadiness }));

import { POST } from "@/app/api/admin/workshop-sales/route";

const request = (body: unknown, key = "secret") => new Request("https://crececonia.cl/api/admin/workshop-sales", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-admin-key": key },
  body: JSON.stringify(body),
});

describe("POST /api/admin/workshop-sales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_SECRET = "secret";
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockDeliver.mockResolvedValue({ sentCount: 1 });
    mockLate.mockResolvedValue({ sentCount: 0 });
    mockReadiness.mockResolvedValue({ ready: true, missing: [] });
  });

  it("rechaza una clave administrativa incorrecta", async () => {
    const response = await POST(request({ action: "advance" }, "wrong"));
    expect(response.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("avanza el tramo mediante el RPC protegido", async () => {
    const response = await POST(request({ action: "advance" }));
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("admin_advance_workshop_tier", expect.objectContaining({ p_product_key: expect.any(String) }));
  });

  it("registra una venta externa y entrega todos los accesos", async () => {
    mockRpc.mockResolvedValue({ data: "workshop-manual-123", error: null });
    const response = await POST(request({ action: "manual", email: " Cliente@Empresa.cl " }));
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("admin_register_workshop_purchase", expect.objectContaining({ p_email: "cliente@empresa.cl" }));
    expect(mockDeliver.mock.calls.map((call) => call[0])).toEqual(["welcome", "ebooks", "admin-notification"]);
    expect(mockDeliver).toHaveBeenCalledWith("welcome", "workshop-manual-123");
    expect(mockLate).toHaveBeenCalledWith("workshop-manual-123");
  });

  it("reencola y envía los recursos a todos los compradores", async () => {
    const response = await POST(request({ action: "resend-resources" }));
    expect(response.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith("requeue_workshop_follow_up", expect.objectContaining({ p_product_key: expect.any(String) }));
    expect(mockDeliver).toHaveBeenCalledWith("follow-up");
  });

  it("no registra correos inválidos", async () => {
    const response = await POST(request({ action: "manual", email: "correo-invalido" }));
    expect(response.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("no agrega alumnos ni reenvía cuando falta un entregable obligatorio", async () => {
    mockReadiness.mockResolvedValue({ ready: false, missing: ["recording"] });

    const manual = await POST(request({ action: "manual", email: "alumno@test.com" }));
    const resend = await POST(request({ action: "resend-resources" }));

    expect(manual.status).toBe(409);
    expect(resend.status).toBe(409);
    expect(mockDeliver).not.toHaveBeenCalled();
  });
});
