export const SERVICE_BUDGETS = {
  mentoria: ["Menos de $400.000 CLP mensuales", "$400.000–$600.000 CLP mensuales", "Más de $600.000 CLP mensuales"],
  implementacion: ["Menos de $500.000 CLP", "$500.000–$1.000.000 CLP", "$1.000.000–$2.000.000 CLP", "Más de $2.000.000 CLP"],
} as const;
export type QualificationService = keyof typeof SERVICE_BUDGETS;
const AVAILABILITY = ["Menos de 2 horas", "2–4 horas", "5 horas o más"];
const DECISIONS = ["Yo tomo la decisión", "Yo propongo y otra persona aprueba", "Ya hay un responsable disponible", "No sé quién decide todavía"];

export function parseQualification(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("invalid");
  const input = body as Record<string, unknown>;
  const text = (key: string, max: number, required = true) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if ((required && !value) || value.length > max) throw new Error("invalid");
    return value;
  };
  const service = input.service;
  if (service !== "mentoria" && service !== "implementacion") throw new Error("invalid");
  const requestId = text("requestId", 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new Error("invalid");
  const email = text("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || input.confirmed !== true) throw new Error("invalid");
  const budget = text("budget", 80);
  if (!(SERVICE_BUDGETS[service] as readonly string[]).includes(budget)) throw new Error("invalid");
  const availability = service === "mentoria" ? text("availability", 40) : "";
  const decision = service === "implementacion" ? text("decision", 80) : "";
  const context = service === "implementacion" ? text("context", 2000) : "";
  if (service === "mentoria" && !AVAILABILITY.includes(availability)) throw new Error("invalid");
  if (service === "implementacion" && !DECISIONS.includes(decision)) throw new Error("invalid");
  return {
    requestId, service, email, name: text("name", 160), company: text("company", 160),
    role: text("role", 160), result: text("result", 2000), budget, availability, decision, context,
    qualified: budget !== SERVICE_BUDGETS[service][0] && (service === "mentoria"
      ? availability !== AVAILABILITY[0]
      : decision !== DECISIONS[3] && context.length >= 20),
  };
}
