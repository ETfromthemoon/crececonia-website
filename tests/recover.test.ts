import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/ebook-delivery-email", () => ({ sendEbookDeliveryEmail: mockSend }));

let rows: Array<{ resource: string; flow_token: string; purchased_at: string }> = [];
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
  }),
}));

import { POST } from "@/app/api/ebook/recover/route";

function request(email: string) {
  return new Request("https://test.com/api/ebook/recover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

describe("POST /api/ebook/recover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rows = [];
    mockSend.mockResolvedValue(undefined);
  });

  it("no revela si el email tiene compras", async () => {
    const res = await POST(request("nadie@test.com"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Si existe una compra asociada, enviamos enlaces nuevos a ese email." });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("envía enlaces por email y deduplica ebooks comprados más de una vez", async () => {
    rows = [
      { resource: "ebook:agentes-de-ia", flow_token: "nuevo", purchased_at: "2026-08-10" },
      { resource: "ebook:agentes-de-ia", flow_token: "viejo", purchased_at: "2026-08-01" },
      { resource: "ebook:claude-nivel-experto", flow_token: "tok-claude", purchased_at: "2026-08-02" },
    ];

    expect((await POST(request("comprador@test.com"))).status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith({
      email: "comprador@test.com",
      recovery: true,
      grants: [
        { resource: "ebook:agentes-de-ia", token: "nuevo" },
        { resource: "ebook:claude-nivel-experto", token: "tok-claude" },
      ],
    });
  });

  it("mantiene una respuesta genérica si falla el envío", async () => {
    rows = [{ resource: "ebook:agentes-de-ia", flow_token: "tok", purchased_at: "2026-08-10" }];
    mockSend.mockRejectedValueOnce(new Error("timeout"));

    const res = await POST(request("comprador@test.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Si existe una compra asociada, enviamos enlaces nuevos a ese email." });
  });
});
