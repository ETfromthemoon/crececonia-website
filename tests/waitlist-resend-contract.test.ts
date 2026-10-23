import { afterEach, expect, it, vi } from "vitest";

const { insert } = vi.hoisted(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: () => ({ insert }) }) }));

// Usa el SDK instalado: sólo la red y la persistencia están simuladas. Resend
// convierte un rechazo de fetch en { error }, no en una excepción de send.
import { addToWaitlist } from "@/lib/ebook-waitlist";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("registra el fallo de red normalizado por Resend y conserva el alta de waitlist", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error("network unavailable"));
  vi.stubGlobal("fetch", fetchMock);
  const log = vi.spyOn(console, "error").mockImplementation(() => {});

  await expect(addToWaitlist({ email: "lead@example.com", resource: "ebook:agentes-de-ia" })).resolves.toBeUndefined();

  expect(insert).toHaveBeenCalledOnce();
  expect(fetchMock).toHaveBeenCalledOnce();
  expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/emails");
  expect(log).toHaveBeenCalledOnce();
});
