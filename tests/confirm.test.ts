import { describe, it, expect, vi, beforeEach } from "vitest";
import { DEFAULT_EBOOK_RESOURCE } from "@/lib/ebook-catalog";

const { mockInsert, mockResendSend, mockFrom, mockDelete } = vi.hoisted(() => ({
  mockInsert: vi.fn().mockResolvedValue({ error: null }),
  mockResendSend: vi.fn().mockResolvedValue({ id: "email-id" }),
  mockFrom: vi.fn(),
  mockDelete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function (this: Record<string, unknown>) {
    this.emails = { send: mockResendSend };
  }),
}));

vi.mock("@/lib/ebook-pricing", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/ebook-pricing")>();
  return { ...real, decrementCupo: vi.fn().mockResolvedValue(undefined) };
});

const { mockCaptureServerEvent } = vi.hoisted(() => ({
  mockCaptureServerEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/posthog-server", () => ({
  captureServerEvent: mockCaptureServerEvent,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { POST } from "@/app/api/flow/confirm/route";
import { decrementCupo } from "@/lib/ebook-pricing";

function flowWebhook(token: string | null) {
  const body = token ? `token=${token}` : "";
  return new Request("https://test.com/api/flow/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
}

/**
 * Simula la respuesta REAL de `getStatus` de Flow. Dos detalles que este mock
 * tenía mal y que dejaron pasar a producción una entrega fallida:
 *
 * - el email del comprador va en `payer`, no en `email`;
 * - `amount` es un string, no un number.
 *
 * Con el mock devolviendo `email` y un number, los 114 tests quedaban verdes
 * mientras el webhook real insertaba `email: undefined` y no entregaba nada.
 */
function mockFlowStatus(status: number, amount = 10800) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      status,
      payer: "comprador@test.com",
      amount: String(amount),
      flowOrder: 12345,
    }),
  });
}

// existingByResource: mapa resource -> ¿ya existe una fila para este flow_token+resource?
function setupDb(options: {
  pendingResources: { resource: string; tier: string; amount: number }[] | null;
  existingByResource?: Record<string, boolean>;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "ebook_pending_orders") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: options.pendingResources
            ? { resources: options.pendingResources, discount_code: null }
            : null,
        }),
        delete: mockDelete,
      };
    }

    // ebook_purchases: cada llamada a db.from("ebook_purchases") crea un
    // builder nuevo para UNA sola query encadenada (.select().eq().eq()
    // .maybeSingle()), así que un closure local alcanza para recordar qué
    // resource se filtró — sin necesidad de jugar con `this`.
    let queriedResource = "";
    const builder = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, value: string) => {
        if (field === "resource") queriedResource = value;
        return builder;
      }),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: options.existingByResource?.[queriedResource] ? { id: "existing" } : null,
        })
      ),
      insert: mockInsert,
    };
    return builder;
  });
}

describe("POST /api/flow/confirm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("responde 200 cuando no hay token en el body", async () => {
    const res = await POST(flowWebhook(null));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("OK");
  });

  it("responde 200 sin insertar cuando Flow retorna status != 2", async () => {
    mockFlowStatus(1);
    setupDb({ pendingResources: null });
    const res = await POST(flowWebhook("tok_pendiente"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("1 libro (sin pending row): reconstruye tier desde el monto — comportamiento legado", async () => {
    mockFlowStatus(2);
    setupDb({ pendingResources: null });
    const res = await POST(flowWebhook("tok_legado"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 10800 })
    );
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  // Regresión: el email del comprador se guarda y se usa para enviar. Ningún
  // test afirmaba esto, así que cuando el código leía `payment.email` (campo
  // que Flow no devuelve) la suite seguía verde y un comprador real pagó
  // $17.900 sin recibir el libro.
  it("guarda el email que Flow devuelve en 'payer' y le envía ahí", async () => {
    mockFlowStatus(2);
    setupDb({ pendingResources: null });

    await POST(flowWebhook("tok_email"));

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "comprador@test.com" })
    );
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "comprador@test.com" })
    );
  });

  it("no entrega ni inserta si Flow no devuelve el email del comprador", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 2, amount: "10800", flowOrder: 12345 }),
    });
    setupDb({ pendingResources: null });

    const res = await POST(flowWebhook("tok_sin_payer"));

    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("combo de 2 libros: inserta 2 filas, decrementa 2 cupos, manda 1 solo email", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 },
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 9720 },
      ],
    });

    const res = await POST(flowWebhook("tok_combo"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: DEFAULT_EBOOK_RESOURCE, amount: 9720 })
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ resource: "ebook:agentes-de-ia", amount: 9720 })
    );
    expect(decrementCupo).toHaveBeenCalledTimes(2);
    expect(mockResendSend).toHaveBeenCalledOnce();
    expect(mockCaptureServerEvent).toHaveBeenCalledWith(
      "ebook_purchase_confirmed",
      "comprador@test.com",
      expect.objectContaining({ resource: DEFAULT_EBOOK_RESOURCE, amount: 9720 })
    );
    expect(mockCaptureServerEvent).toHaveBeenCalledWith(
      "ebook_purchase_confirmed",
      "comprador@test.com",
      expect.objectContaining({ resource: "ebook:agentes-de-ia", amount: 9720 })
    );
  });

  it("combo con 1 libro ya confirmado (retry parcial): solo inserta el que falta", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 },
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 9720 },
      ],
      existingByResource: { [DEFAULT_EBOOK_RESOURCE]: true },
    });

    const res = await POST(flowWebhook("tok_retry"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ resource: "ebook:agentes-de-ia" }));
  });

  it("no reinserta ni reenvía email si TODO el combo ya está confirmado (idempotencia total)", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [{ resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 }],
      existingByResource: { [DEFAULT_EBOOK_RESOURCE]: true },
    });

    const res = await POST(flowWebhook("tok_duplicado"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
  });

  it("no borra la orden pendiente si un insert falla genuinamente (permite reintentar)", async () => {
    mockFlowStatus(2, 19440);
    setupDb({
      pendingResources: [
        { resource: DEFAULT_EBOOK_RESOURCE, tier: "super-early", amount: 9720 },
        { resource: "ebook:agentes-de-ia", tier: "regular", amount: 9720 },
      ],
    });
    mockInsert.mockImplementation((row: { resource: string }) =>
      row.resource === "ebook:agentes-de-ia"
        ? Promise.resolve({ error: { message: "db down" } })
        : Promise.resolve({ error: null })
    );

    const res = await POST(flowWebhook("tok_partial_fail"));
    expect(res.status).toBe(200);
    expect(mockDelete).not.toHaveBeenCalled();
    // El libro que sí se guardó igual se entrega — no se le puede negar la
    // descarga a alguien que ya pagó por la falla de otro item del combo.
    expect(mockResendSend).toHaveBeenCalledOnce();
  });

  it("retorna 200 aunque el envío de email falle", async () => {
    mockFlowStatus(2);
    setupDb({ pendingResources: null });
    mockResendSend.mockRejectedValueOnce(new Error("Resend timeout"));
    const res = await POST(flowWebhook("tok_email_fail"));
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalled();
  });

  it("retorna 200 cuando Flow API falla", async () => {
    mockFetch.mockRejectedValue(new Error("Flow timeout"));
    const res = await POST(flowWebhook("tok_flow_down"));
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("asigna tier early para monto 17900 (fallback legado)", async () => {
    mockFlowStatus(2, 17900);
    setupDb({ pendingResources: null });
    await POST(flowWebhook("tok_early"));
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ tier: "early", amount: 17900 }));
  });

  it("asigna tier regular para monto 27000 (fallback legado)", async () => {
    mockFlowStatus(2, 27000);
    setupDb({ pendingResources: null });
    await POST(flowWebhook("tok_regular"));
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ tier: "regular", amount: 27000 }));
  });
});
