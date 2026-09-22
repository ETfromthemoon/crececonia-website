import { beforeEach, describe, expect, it, vi } from "vitest";

const { saveSubscriber, saveEvaluation, saveCallRequest, notifyAdmin } = vi.hoisted(() => ({
  saveSubscriber: vi.fn(),
  saveEvaluation: vi.fn(),
  saveCallRequest: vi.fn(),
  notifyAdmin: vi.fn(),
}));

vi.mock("@/lib/public-leads", () => ({
  PUBLIC_LEAD_LIMITS: { email: 254, short: 160, long: 2_000, resource: 180 },
  clean: (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "",
  isValidEmail: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  saveSubscriber,
  saveEvaluation,
  saveCallRequest,
  notifyAdmin,
}));

import { POST as subscribe } from "@/app/api/public/subscribe/route";
import { POST as evaluate } from "@/app/api/public/evaluacion/route";
import { POST as requestCall } from "@/app/api/public/solicitar-llamada/route";

function post(path: string, body: unknown, origin = "https://www.crececonia.cl") {
  return new Request(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("rutas públicas sin VPS", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveEvaluation.mockResolvedValue({ id: "evaluation-id", scheduling_token: "token-id" });
    saveCallRequest.mockResolvedValue({ id: "call-id", nombre: "Sergio", email: "sergio@example.com" });
  });

  it("normaliza y guarda una suscripción", async () => {
    const response = await subscribe(post("/api/public/subscribe", {
      email: "  PERSONA@EXAMPLE.COM ", source: "skills_page", resource: "captaclientes",
    }));
    expect(response.status).toBe(200);
    expect(saveSubscriber).toHaveBeenCalledWith("persona@example.com", "skills_page", "captaclientes");
  });

  it("rechaza una suscripción inválida sin escribir", async () => {
    const response = await subscribe(post("/api/public/subscribe", { email: "invalido" }));
    expect(response.status).toBe(400);
    expect(saveSubscriber).not.toHaveBeenCalled();
  });

  it("guarda una evaluación completa y notifica al administrador", async () => {
    const response = await evaluate(post("/api/public/evaluacion", {
      nombre: "Sergio", email: "sergio@example.com", empresa: "CrececonIA",
      empresa_descripcion: "Consultoría de inteligencia artificial", tamano_equipo: "1-10",
      rol: "Director", proceso_pain: "Seguimiento manual de oportunidades",
      uso_ia_actual: "regular", resultado_esperado: "Automatizar el seguimiento comercial",
      horizonte_decision: "mes", source: "homepage",
    }));
    expect(response.status).toBe(200);
    expect(saveEvaluation).toHaveBeenCalledOnce();
    expect(notifyAdmin).toHaveBeenCalledOnce();
  });

  it("envía el enlace de agenda del mismo entorno que recibió la evaluación", async () => {
    const origin = "https://preview.crececonia.example";
    const response = await evaluate(post("/api/public/evaluacion", {
      nombre: "Sergio", email: "sergio@example.com", empresa: "CrececonIA",
      tamano_equipo: "1-10", rol: "Director", proceso_pain: "Seguimiento manual",
      uso_ia_actual: "regular", resultado_esperado: "Automatizar seguimiento",
      horizonte_decision: "mes",
    }, origin));
    expect(response.status).toBe(200);
    expect(notifyAdmin.mock.calls[0][1]).toContain(`${origin}/solicitar-llamada?t=token-id`);
  });

  it("no acepta evaluaciones incompletas", async () => {
    const response = await evaluate(post("/api/public/evaluacion", { email: "sergio@example.com" }));
    expect(response.status).toBe(400);
    expect(saveEvaluation).not.toHaveBeenCalled();
  });

  it("guarda hasta tres horarios para un token válido", async () => {
    const response = await requestCall(post("/api/public/solicitar-llamada", {
      token: "550e8400-e29b-41d4-a716-446655440000",
      horarios_preferidos: ["lunes 10:00", "martes 11:00", "miércoles 12:00", "jueves 13:00"],
      mensaje: "Prefiero Google Meet",
    }));
    expect(response.status).toBe(200);
    expect(saveCallRequest).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      ["lunes 10:00", "martes 11:00", "miércoles 12:00"],
      "Prefiero Google Meet",
    );
    expect(notifyAdmin).toHaveBeenCalledOnce();
  });

  it("rechaza tokens inválidos y devuelve 404 para tokens desconocidos", async () => {
    const invalid = await requestCall(post("/api/public/solicitar-llamada", {
      token: "no-es-uuid", horarios_preferidos: ["lunes"],
    }));
    expect(invalid.status).toBe(400);
    expect(saveCallRequest).not.toHaveBeenCalled();

    saveCallRequest.mockResolvedValueOnce(null);
    const missing = await requestCall(post("/api/public/solicitar-llamada", {
      token: "550e8400-e29b-41d4-a716-446655440000", horarios_preferidos: ["lunes"],
    }));
    expect(missing.status).toBe(404);
  });
});
