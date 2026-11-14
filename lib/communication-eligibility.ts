export const communicationReasons = {
  global_suppression: "Baja global vigente",
  scope_suppression: "Baja para esta finalidad",
  consent_unknown: "Permiso sin evidencia comprobada",
  consent_missing: "Falta un permiso vigente para esta finalidad",
  already_purchased: "Ya adquirió el producto objetivo",
  purchase_unknown: "Estado de compra pendiente de comprobación",
  frequency_unknown: "Frecuencia o historial sin comprobar",
  frequency_limit: "Límite de frecuencia alcanzado",
  duplicate: "Mensaje ya procesado",
  deduplication_unknown: "Historial de duplicación sin comprobar",
  campaign_not_configured: "Campaña y política pendientes",
} as const;
export type CommunicationReason = keyof typeof communicationReasons;
export type CommunicationEligibilityInput = {
  global: "unknown" | "allowed" | "suppressed";
  consent: "unknown" | "missing" | "granted" | "suppressed";
  purchase: "not_applicable" | "purchased" | "not_purchased" | "unknown";
  frequency: "unknown" | "within_limit" | "limit_reached";
  deduplication: "unknown" | "new" | "duplicate";
  campaignConfigured: boolean;
};

// This decision is a simulation only, never an authorization to send. Future
// dispatch must re-read consent, purchases and counters immediately before sending.
export function evaluateCommunication(input: CommunicationEligibilityInput) {
  const reasons: CommunicationReason[] = [];
  if (input.global === "suppressed") reasons.push("global_suppression");
  if (input.consent === "suppressed") reasons.push("scope_suppression");
  if (input.consent === "unknown") reasons.push("consent_unknown");
  if (input.consent === "missing") reasons.push("consent_missing");
  if (input.purchase === "purchased") reasons.push("already_purchased");
  if (input.purchase === "unknown") reasons.push("purchase_unknown");
  if (input.frequency === "unknown") reasons.push("frequency_unknown");
  if (input.frequency === "limit_reached") reasons.push("frequency_limit");
  if (input.deduplication === "duplicate") reasons.push("duplicate");
  if (input.deduplication === "unknown") reasons.push("deduplication_unknown");
  if (!input.campaignConfigured) reasons.push("campaign_not_configured");
  const excluded = reasons.some(reason => ["global_suppression", "scope_suppression", "consent_unknown", "consent_missing", "already_purchased", "frequency_limit", "duplicate"].includes(reason));
  return { state: excluded ? "excluded" : reasons.length ? "pending_verification" : "eligible_for_simulation", reasons, canSend: false as const };
}
