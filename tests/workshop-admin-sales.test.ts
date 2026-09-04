import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc, mockDeliver, mockLate } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockDeliver: vi.fn(),
  mockLate: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ rpc: mockRpc }) }));
vi.mock("@/lib/workshop-delivery", () => ({ deliverWorkshopOrders: mockDeliver, deliverLateWorkshopAccessIfNeeded: mockLate }));

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

  it("no registra correos inválidos", async () => {
    const response = await POST(request({ action: "manual", email: "correo-invalido" }));
    expect(response.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
