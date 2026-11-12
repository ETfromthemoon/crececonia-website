/** Public commercial terms. Budget option strings are also persisted API values. */
const clp = (amount: number) => `$${new Intl.NumberFormat("es-CL").format(amount)} CLP`;
const mentorshipMinimum = 400000;
const implementationMinimum = 500000;
const maintenanceMinimum = 100000;

export const SERVICE_OFFERS = {
  mentoria: {
    minimumPrice: mentorshipMinimum,
    investment: `Desde ${clp(mentorshipMinimum)} mensuales`,
    confirmation: `Entiendo que la mentoría parte desde ${clp(mentorshipMinimum)} mensuales y que debo trabajar entre sesiones.`,
    conditions: "Los 90 días son el horizonte de tu objetivo. Antes de contratar acordamos el ciclo de acompañamiento, las sesiones y su calendario, los entregables, el precio final, los impuestos aplicables y las condiciones de pago y renovación.",
  },
  implementacion: {
    minimumPrice: implementationMinimum,
    maintenanceMinimum,
    investment: `Desde ${clp(implementationMinimum)} + mantención desde ${clp(maintenanceMinimum)} mensuales`,
    confirmation: `Entiendo que la implementación parte desde ${clp(implementationMinimum)} y requiere mantención desde ${clp(maintenanceMinimum)} mensuales.`,
    conditions: "Antes de contratar acordamos alcance, entregables, datos y accesos necesarios, responsables, pruebas de aceptación y plazos. La propuesta detalla el precio final, los impuestos aplicables, las condiciones de pago y qué incluye la mantención y el soporte.",
  },
} as const;

// Keep these wire values stable: saved requests and idempotency hashes use them.
export const SERVICE_BUDGETS = {
  mentoria: ["Menos de $400.000 CLP mensuales", "$400.000–$600.000 CLP mensuales", "Más de $600.000 CLP mensuales"],
  implementacion: ["Menos de $500.000 CLP", "$500.000–$1.000.000 CLP", "$1.000.000–$2.000.000 CLP", "Más de $2.000.000 CLP"],
} as const;
export type QualificationService = keyof typeof SERVICE_BUDGETS;
export const AVAILABILITY = ["Menos de 2 horas", "2–4 horas", "5 horas o más"];
export const DECISIONS = ["Yo tomo la decisión", "Yo propongo y otra persona aprueba", "Ya hay un responsable disponible", "No sé quién decide todavía"];

/** Eligibility only; parseQualification validates the complete server payload. */
export function qualifiesForService(input: {
  service: QualificationService; budget: string; availability: string; decision: string; context: string;
}) {
  const { service, budget, availability, decision, context } = input;
  return (SERVICE_BUDGETS[service] as readonly string[]).includes(budget)
    && budget !== SERVICE_BUDGETS[service][0]
    && (service === "mentoria"
      ? AVAILABILITY.includes(availability) && availability !== AVAILABILITY[0]
      : DECISIONS.includes(decision) && decision !== DECISIONS[3] && context.trim().length >= 20);
}
