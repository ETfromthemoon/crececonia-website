import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { read, insert, list, finalize } = vi.hoisted(() => ({ read: vi.fn(), insert: vi.fn(), list: vi.fn(), finalize: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: (table: string) => ({ select: () => read(table), insert }) }) }));
vi.mock("@/lib/ebook-recovery", async (original) => ({ ...await original<typeof import("@/lib/ebook-recovery")>(), listPaidFlowPaymentsForDay: list }));
vi.mock("@/lib/ebook-payment-finalization-core", () => ({ finalizeEbookPaymentWithQuery: finalize, isEbookFinalizationEnabled: () => process.env.EBOOK_PAYMENT_FINALIZATION_ENABLED === "true" }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => ({ query: vi.fn() }) }));
import { recoverDeliveries } from "../scripts/recuperar-entregas";
describe("CLI comparte finalización y nunca envía directamente", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "postgres://test@neon.test/neondb"); vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", "true");
    read.mockImplementation(async (table) => ({ data: table === "ebook_purchases" ? [] : [{ commerce_order: "ebook-123-abc123", discount_code: null,
      resources: [{ resource: "ebook:agentes-de-ia", tier: "regular", amount: 27000 }] }], error: null }));
    list.mockResolvedValue([{ flowOrder: 99, commerceOrder: "ebook-123-abc123", amount: "27000", status: 2, payer: "buyer@example.com" }]);
    finalize.mockResolvedValue({ outcome: "finalized", jobId: "synthetic" }); vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it("requiere Neon para diagnóstico", async () => {
    vi.stubEnv("DATABASE_URL", ""); await expect(recoverDeliveries()).rejects.toThrow("DATABASE_URL"); expect(read).not.toHaveBeenCalled();
  });
  it("cierra --aplicar sin flag antes de leer o escribir", async () => {
    vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", ""); await expect(recoverDeliveries(["--aplicar"])).rejects.toThrow("corte coordinado");
    expect(read).not.toHaveBeenCalled(); expect(finalize).not.toHaveBeenCalled(); expect(insert).not.toHaveBeenCalled();
  });
  it("usa finalizador compartido con token aleatorio y fuente recovery incluso --enviar-email", async () => {
    await recoverDeliveries(["--aplicar", "--enviar-email"]); expect(finalize).toHaveBeenCalledTimes(1);
    const input = finalize.mock.calls[0][1];
    expect(input).toMatchObject({ flowOrder: "99", commerceOrder: "ebook-123-abc123", email: "buyer@example.com", amount: 27000, source: "recovery" });
    expect(input.token).toMatch(/^recuperado-[A-Za-z0-9_-]{43}$/); expect(insert).not.toHaveBeenCalled();
    expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain(input.token); expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain("buyer@example.com");
  });
  it("genera tokens no derivables por ejecución", async () => {
    await recoverDeliveries(["--aplicar"]); await recoverDeliveries(["--aplicar"]); expect(finalize.mock.calls[0][1].token).not.toBe(finalize.mock.calls[1][1].token);
  });
  it("no cae a escritura legacy ni expone error privado cuando falla la transacción", async () => {
    finalize.mockRejectedValueOnce(new Error("buyer@example.com token-secret"));
    await expect(recoverDeliveries(["--aplicar", "--enviar-email"])).rejects.toThrow(/^Falló la finalización de flowOrder 99;/); expect(insert).not.toHaveBeenCalled();
  });
  it("dry-run funciona con flag ausente y no finaliza", async () => {
    vi.stubEnv("EBOOK_PAYMENT_FINALIZATION_ENABLED", ""); await recoverDeliveries(); expect(read).toHaveBeenCalled(); expect(finalize).not.toHaveBeenCalled();
  });
  it("lectura incompleta de Flow aborta antes de finalizar", async () => {
    list.mockRejectedValueOnce(new Error("Flow HTTP 503")); await expect(recoverDeliveries(["--aplicar"])).rejects.toThrow("Flow HTTP 503"); expect(finalize).not.toHaveBeenCalled();
  });
  it("lectura incompleta de Neon aborta antes de Flow", async () => {
    read.mockResolvedValue({ data: null, error: { message: "Database unavailable" } }); await expect(recoverDeliveries()).rejects.toThrow("No se pudo leer la base"); expect(list).not.toHaveBeenCalled();
  });
});
