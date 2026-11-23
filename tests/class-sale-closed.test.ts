import { describe, expect, it, vi } from "vitest";

const { getSupabaseAdmin } = vi.hoisted(() => ({ getSupabaseAdmin: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin }));

import { isClassSaleClosed, CLASS_END } from "@/lib/class-product";
import { GET } from "@/app/api/clase/availability/route";
import { POST } from "@/app/api/clase/create/route";

describe("cierre de la clase pasada", () => {
  it("cierra la venta a partir de la hora de término", () => {
    expect(isClassSaleClosed(Date.parse(CLASS_END) - 1)).toBe(false);
    expect(isClassSaleClosed(Date.parse(CLASS_END))).toBe(true);
  });

  it("no expone ofertas ni consulta la base después de la clase", async () => {
    const response = await GET();
    expect(response.status).toBe(410);
    expect((await response.json()).offers).toEqual([]);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });

  it("no crea órdenes ni llama a Flow después de la clase", async () => {
    const request = new Request("https://www.crececonia.cl/api/clase/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "buyer@example.test", offerKey: "early-25000" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(410);
    expect(getSupabaseAdmin).not.toHaveBeenCalled();
  });
});
