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
    insert.mockResolvedValue({ error: null });
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("rechaza configuración legacy para no conciliar otra base por accidente", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://legacy.test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-key");
    await expect(recoverDeliveries()).rejects.toThrow("DATABASE_URL");
    expect(read).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it("inserta todos los recursos faltantes en una sola sentencia con token aleatorio", async () => {
    read.mockImplementation(async (table) => ({ data: table === "ebook_purchases" ? [] : [{
      commerce_order: "ebook-123-abc123", discount_code: null,
      resources: [
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 13500 },
        { resource: "ebook:de-cero-a-claude-en-una-semana", tier: "early", amount: 13500 },
      ],
    }], error: null }));
    await recoverDeliveries(["--aplicar", "--enviar-email"]);
    expect(insert).toHaveBeenCalledTimes(1);
    const rows = insert.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].flow_token).toMatch(/^recuperado-[A-Za-z0-9_-]{43}$/);
    expect(rows[0].flow_token).not.toBe("recuperado-99");
    expect(rows[1].flow_token).toBe(rows[0].flow_token);
    expect(email).toHaveBeenCalledWith(expect.objectContaining({ grants: rows.map((row: { resource: string; flow_token: string }) => ({ resource: row.resource, token: row.flow_token })) }));
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(rows[0].flow_token);
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain("buyer@example.com");
  });

  it("genera un token distinto por ejecución, no derivado de flowOrder", async () => {
    await recoverDeliveries(["--aplicar"]);
    await recoverDeliveries(["--aplicar"]);
    expect(insert.mock.calls[0][0][0].flow_token).not.toBe(insert.mock.calls[1][0][0].flow_token);
  });

  it("un conflicto de inserción aborta la orden sin correo ni segundo insert", async () => {
    read.mockImplementation(async (table) => ({ data: table === "ebook_purchases" ? [] : [{
      commerce_order: "ebook-123-abc123", discount_code: null,
      resources: [
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 13500 },
        { resource: "ebook:de-cero-a-claude-en-una-semana", tier: "early", amount: 13500 },
      ],
    }], error: null }));
    insert.mockResolvedValue({ error: { message: "duplicate key" } });
    await expect(recoverDeliveries(["--aplicar", "--enviar-email"])).rejects.toThrow("Falló la recuperación");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toHaveLength(2);
    expect(email).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it("distingue una compra registrada de un correo fallido sin exponer el error del proveedor", async () => {
    email.mockRejectedValueOnce(new Error("Rejected buyer@example.com token-secret"));
    await expect(recoverDeliveries(["--aplicar", "--enviar-email"])).rejects.toThrow(/^Compra registrada para flowOrder 99, pero el correo de recuperación falló/);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
  });

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
