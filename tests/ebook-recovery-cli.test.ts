import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { read, insert, list, email, notify } = vi.hoisted(() => ({
  read: vi.fn(), insert: vi.fn(), list: vi.fn(), email: vi.fn(), notify: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: (table: string) => ({ select: () => read(table), insert }) }) }));
vi.mock("@/lib/ebook-recovery", async (original) => ({ ...await original<typeof import("@/lib/ebook-recovery")>(), listPaidFlowPaymentsForDay: list }));
vi.mock("@/lib/ebook-delivery-email", () => ({ sendEbookDeliveryEmail: email }));
vi.mock("@/lib/purchase-notification-email", () => ({ sendPurchaseNotification: notify }));
import { recoverDeliveries } from "../scripts/recuperar-entregas";

describe("CLI de conciliación en Neon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DATABASE_URL", "postgres://test@neon.test/neondb");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    read.mockImplementation(async (table) => ({ data: table === "ebook_purchases" ? [] : [{
      commerce_order: "ebook-123-abc123", discount_code: null,
      resources: [{ resource: "ebook:agentes-de-ia", tier: "regular", amount: 27000 }],
    }], error: null }));
    list.mockResolvedValue([{ flowOrder: 99, commerceOrder: "ebook-123-abc123", amount: "27000", status: 2, payer: "buyer@example.com" }]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it("funciona sin credenciales Supabase y no escribe ni envía por defecto", async () => {
    await recoverDeliveries();
    expect(read).toHaveBeenCalledWith("ebook_purchases");
    expect(list).toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(email).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("aborta antes de escribir incluso con --aplicar si Flow no se pudo consultar", async () => {
    list.mockRejectedValueOnce(new Error("Flow HTTP 503"));
    await expect(recoverDeliveries(["--aplicar", "--enviar-email"])).rejects.toThrow("Flow HTTP 503");
    expect(insert).not.toHaveBeenCalled();
    expect(email).not.toHaveBeenCalled();
  });

  it("aborta antes de consultar Flow si falló la lectura de la base", async () => {
    read.mockResolvedValue({ data: null, error: { message: "Database unavailable" } });
    await expect(recoverDeliveries()).rejects.toThrow(/No se pudo leer la base/);
    expect(list).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
});
