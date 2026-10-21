import { afterEach, describe, expect, it, vi } from "vitest";
import { listPaidFlowPaymentsForDay, planEbookRecovery, type RecoveryManifest, type RecoveryPayment } from "@/lib/ebook-recovery";

const book = "ebook:de-cero-a-claude-en-una-semana";
const agents = "ebook:agentes-de-ia";
const payment: RecoveryPayment = { flowOrder: 99, commerceOrder: "ebook-123-abc123", status: 2, amount: "19440", payer: "buyer@example.com", requestDate: "2026-10-20" };
const manifest: RecoveryManifest = { commerce_order: payment.commerceOrder, discount_code: null, resources: [
  { resource: book, tier: "super-early", amount: 9720 },
  { resource: agents, tier: "regular", amount: 9720 },
] };
afterEach(() => vi.unstubAllGlobals());

describe("conciliación conservadora de ebooks", () => {
  it("detecta el recurso faltante de un combo parcialmente registrado", () => {
    expect(planEbookRecovery(payment, [{ flow_order: 99, resource: book }], manifest)).toEqual({
      kind: "recoverable", items: [{ resource: agents, tier: "regular", amount: 9720 }],
    });
  });
  it("no asigna el libro por defecto cuando falta el manifiesto", () => {
    expect(planEbookRecovery(payment, []).kind).toBe("review");
  });
  it.each([null, [], [{ resource: agents, tier: "regular", amount: 1 }], [{ resource: "ebook:unknown", tier: "regular", amount: 19440 }]])("deja un manifiesto inválido para revisión: %j", (resources) => {
    expect(planEbookRecovery(payment, [], { ...manifest, resources }).kind).toBe("review");
  });
  it("no recupera automáticamente un canje de descuento", () => {
    expect(planEbookRecovery(payment, [], { ...manifest, discount_code: "TEST" }).kind).toBe("review");
  });
  it("no duplica un combo completo ni confunde pagos de otros servicios", () => {
    expect(planEbookRecovery(payment, [book, agents].map((resource) => ({ flow_order: 99, resource })), manifest).kind).toBe("registered");
    expect(planEbookRecovery({ ...payment, commerceOrder: "workshop-123" }, []).kind).toBe("ignored");
  });
  it("no prepara compras sin email verificable", () => {
    expect(planEbookRecovery({ ...payment, payer: undefined }, [], manifest).kind).toBe("review");
  });
});

describe("lectura paginada de Flow", () => {
  it("recorre hasMore y filtra pagos no confirmados", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ data: [payment, { ...payment, flowOrder: 100, status: 1 }], hasMore: 1 }))
      .mockResolvedValueOnce(Response.json({ data: [{ ...payment, flowOrder: 101 }], hasMore: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const payments = await listPaidFlowPaymentsForDay("https://flow.test", "key", "secret", "2026-10-20");
    expect(payments.map((row) => row.flowOrder)).toEqual([99, 101]);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("start")).toBe("100");
  });
  it("no reporta cero pagos si falla una página posterior", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(Response.json({ data: [payment], hasMore: 1 }))
      .mockResolvedValueOnce(new Response("sensitive provider body", { status: 503 })));
    await expect(listPaidFlowPaymentsForDay("https://flow.test", "key", "secret", "2026-10-20")).rejects.toThrow("HTTP 503");
  });
  it.each([{ data: [] }, { data: [], hasMore: 1 }, { data: [null], hasMore: 0 }])("rechaza una respuesta incompleta: %j", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)));
    await expect(listPaidFlowPaymentsForDay("https://flow.test", "key", "secret", "2026-10-20")).rejects.toThrow(/incompleta/);
  });
  it("no expone la URL firmada ante errores de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("https://flow.test?apiKey=secret")));
    await expect(listPaidFlowPaymentsForDay("https://flow.test", "key", "secret", "2026-10-20")).rejects.toThrow(/^No se pudo consultar Flow el 2026-10-20/);
  });
});
