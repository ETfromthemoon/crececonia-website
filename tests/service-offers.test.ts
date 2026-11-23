import { describe, expect, it } from "vitest";
import { AVAILABILITY, DECISIONS, SERVICE_BUDGETS, qualifiesForService, SERVICE_OFFERS } from "@/lib/service-offers";
import { parseQualification } from "@/lib/service-qualification";

const base = {
  requestId: "964c3f74-192f-4b17-845a-7f7bf0b0c909", name: "Persona", email: "persona@example.com",
  company: "Empresa", role: "Dueño", result: "Mejorar las respuestas", confirmed: true,
};

describe("shared service eligibility compatibility", () => {
  it("preserves every historical mentorship budget and availability combination", () => {
    for (const budget of SERVICE_BUDGETS.mentoria) for (const availability of AVAILABILITY) {
      const input = { ...base, service: "mentoria" as const, budget, availability, decision: "", context: "" };
      const expected = budget !== "Menos de $400.000 CLP mensuales" && availability !== "Menos de 2 horas";
      expect(qualifiesForService(input)).toBe(expected);
      expect(parseQualification(input)).toEqual({
        requestId: base.requestId, name: base.name, email: base.email, company: base.company,
        role: base.role, result: base.result, service: "mentoria", budget, availability,
        decision: "", context: "", qualified: expected,
      });
    }
  });
  it("preserves implementation decisions and the trimmed context boundary", () => {
    for (const budget of SERVICE_BUDGETS.implementacion) for (const decision of DECISIONS) {
      for (const context of ["x".repeat(19), "x".repeat(20), `  ${"x".repeat(19)}  `, `  ${"x".repeat(20)}  `]) {
        const input = { ...base, service: "implementacion" as const, budget, decision, context, availability: "" };
        const expected = budget !== "Menos de $500.000 CLP" && decision !== "No sé quién decide todavía" && context.trim().length >= 20;
        expect(qualifiesForService(input)).toBe(expected);
        expect(parseQualification(input).qualified).toBe(expected);
        expect(parseQualification(input).context).toBe(context.trim());
      }
    }
  });
  it("does not qualify incomplete or unknown browser options", () => {
    const input = { service: "mentoria" as const, budget: SERVICE_BUDGETS.mentoria[1], availability: "2–4 horas", decision: "", context: "" };
    expect(qualifiesForService({ ...input, budget: "" })).toBe(false);
    expect(qualifiesForService({ ...input, availability: "unknown" })).toBe(false);
  });
  it("keeps the authorized amounts and their public periodicity", () => {
    expect(SERVICE_OFFERS.mentoria.minimumPrice).toBe(400000);
    expect(SERVICE_OFFERS.mentoria.investment).toBe("Desde $400.000 CLP mensuales");
    expect(SERVICE_OFFERS.implementacion.minimumPrice).toBe(500000);
    expect(SERVICE_OFFERS.implementacion.maintenanceMinimum).toBe(100000);
    expect(SERVICE_OFFERS.implementacion.investment).toBe("Desde $500.000 CLP + mantención desde $100.000 CLP mensuales");
  });
});
