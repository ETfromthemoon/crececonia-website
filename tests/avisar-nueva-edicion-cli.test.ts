import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({ Resend: vi.fn().mockImplementation(function () { return { emails: { send } }; }) }));
const select = vi.fn();
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => ({ from: () => ({ select }) }) }));

import { avisarNuevaEdicion } from "../scripts/avisar-nueva-edicion";

const rows = [
  { email: "ana@example.test", resource: "ebook:de-cero-a-claude-en-una-semana", flow_token: "t1", purchased_at: "2026-07-01" },
  { email: "ana@example.test", resource: "ebook:agentes-de-ia", flow_token: "t2", purchased_at: "2026-08-01" },
  { email: "beto@example.test", resource: "ebook:claude-nivel-experto", flow_token: "t3", purchased_at: "2026-08-02" },
];

let cwd: string;
let tmp: string;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  send.mockReset().mockResolvedValue({ data: { id: "re_1" }, error: null });
  select.mockReset().mockResolvedValue({ data: rows, error: null });
  process.env.DATABASE_URL = "postgres://synthetic";
  process.env.RESEND_API_KEY = "re_synthetic";
  cwd = process.cwd();
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aviso-edicion-"));
  process.chdir(tmp);
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(tmp, { recursive: true, force: true });
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("scripts/avisar-nueva-edicion", () => {
  it("por defecto solo simula: lee compras y no envía nada", async () => {
    await expect(avisarNuevaEdicion([])).resolves.toEqual({ modo: "simulacion", enviados: 0, fallidos: 0 });
    expect(select).toHaveBeenCalledWith("email, resource, flow_token, purchased_at");
    expect(send).not.toHaveBeenCalled();
  });

  it("--prueba manda un solo correo a la dirección indicada, sin clave de idempotencia", async () => {
    await avisarNuevaEdicion(["--prueba=dueno@example.test"]);
    expect(send).toHaveBeenCalledTimes(1);
    const [payload, options] = send.mock.calls[0];
    expect(payload.to).toBe("dueno@example.test");
    expect(payload.html).toContain("Agentes de IA para tu Negocio"); // usa a la persona con más libros
    expect(options.idempotencyKey).toBeUndefined();
  });

  it("--enviar manda un correo por persona y al repetir no duplica", async () => {
    await avisarNuevaEdicion(["--enviar"]);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls.map(([p]) => p.to)).toEqual(["ana@example.test", "beto@example.test"]);
    expect(send.mock.calls[0][1].idempotencyKey).toContain("ana@example.test");

    send.mockClear();
    await avisarNuevaEdicion(["--enviar"]);
    expect(send).not.toHaveBeenCalled();
  });

  it("si un envío falla, sigue con el resto, marca error y lo reintenta en la próxima pasada", async () => {
    send.mockResolvedValueOnce({ data: null, error: { message: "rate limit" } });
    await expect(avisarNuevaEdicion(["--enviar"])).resolves.toEqual({ modo: "envio", enviados: 1, fallidos: 1 });
    send.mockClear();
    await avisarNuevaEdicion(["--enviar"]);
    expect(send.mock.calls.map(([p]) => p.to)).toEqual(["ana@example.test"]);
  });

  it("rechaza --prueba y --enviar juntos, y exige las credenciales", async () => {
    await expect(avisarNuevaEdicion(["--enviar", "--prueba=a@b.cl"])).rejects.toThrow("no ambos");
    delete process.env.RESEND_API_KEY;
    await expect(avisarNuevaEdicion(["--enviar"])).rejects.toThrow("RESEND_API_KEY");
  });
});
