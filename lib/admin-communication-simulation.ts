import "server-only";
import { requireAdminSession } from "./admin-auth";
import { queryDatabase } from "./database";
import { evaluateCommunication, type CommunicationReason, type CommunicationEligibilityInput } from "./communication-eligibility";

type Schema = Record<"contacts" | "preferences" | "events" | "subscribers" | "waitlist", boolean>;
type Cohort = { purpose: "newsletter" | "launch_notice"; total: number; excluded: number; pending: number; reasons: Partial<Record<CommunicationReason, number>> };
export type CommunicationSimulation = { schema: "absent" | "partial" | "complete"; missingSources: string[]; cohorts: Cohort[]; canSend: false };
type Group = Record<string, unknown> & { global_state: unknown; consent_state: unknown; count: unknown };
const count = (value: unknown) => {
  if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error("Invalid aggregate");
  return Number(value);
};
export async function loadCommunicationSimulation(): Promise<CommunicationSimulation> {
  await requireAdminSession();
  const [schema] = await queryDatabase<Schema>(`select
    to_regclass('commerce.communication_contacts') is not null as contacts,
    to_regclass('commerce.communication_preferences') is not null as preferences,
    to_regclass('commerce.communication_preference_events') is not null as events,
    to_regclass('commerce.public_subscribers') is not null as subscribers,
    to_regclass('commerce.ebook_waitlist') is not null as waitlist`);
  if (!schema || ["contacts", "preferences", "events", "subscribers", "waitlist"].some(key => typeof schema[key as keyof Schema] !== "boolean")) throw new Error("Invalid schema status");
  const registry = [schema.contacts, schema.preferences, schema.events];
  const state = registry.every(Boolean) ? "complete" : registry.some(Boolean) ? "partial" : "absent";
  const cohorts: Cohort[] = [];
  const missingSources: string[] = [];
  for (const purpose of ["newsletter", "launch_notice"] as const) {
    const sourcePresent = purpose === "newsletter" ? schema.subscribers : schema.waitlist;
    if (!sourcePresent) { missingSources.push(purpose); continue; }
    // Table names and scope expressions are internal constants, never request data.
    const source = purpose === "newsletter" ? "commerce.public_subscribers" : "commerce.ebook_waitlist";
    const resource = purpose === "newsletter" ? "''::text" : "resource";
    const scope = purpose === "newsletter" ? "true" : "p.resource ~ '^ebook:[a-z0-9-]{1,160}$'";
    // Aggregate in PostgreSQL. No recipient, identifier or raw resource reaches the page.
    const groups = await queryDatabase<Group>(`with candidates as (
      select distinct lower(btrim(email)) as email, ${resource} as resource from ${source}
    ) select ${state === "complete" ? `coalesce(c.global_state, 'unknown') as global_state,
      case when f.state = 'suppressed' then 'suppressed'
        when f.state = 'granted' and f.revision > c.last_suppressed_revision and ${scope} then 'granted'
        when c.id is null then 'unknown' else 'missing' end as consent_state` : "'unknown'::text as global_state, 'unknown'::text as consent_state"},
      count(*)::text as count from candidates p
      ${state === "complete" ? `left join commerce.communication_contacts c on c.email = p.email
        left join commerce.communication_preferences f on f.contact_id = c.id and f.purpose = $1 and f.resource = p.resource` : ""}
      group by 1, 2`, state === "complete" ? [purpose] : []);
    const cohort: Cohort = { purpose, total: 0, excluded: 0, pending: 0, reasons: {} };
    for (const group of groups) {
      if (!["unknown", "allowed", "suppressed"].includes(String(group.global_state)) || !["unknown", "missing", "granted", "suppressed"].includes(String(group.consent_state))) throw new Error("Invalid preference aggregate");
      const n = count(group.count);
      const result = evaluateCommunication({ global: group.global_state as CommunicationEligibilityInput["global"],
        consent: group.consent_state as CommunicationEligibilityInput["consent"],
        // No campaign/product exclusion policy has been approved. We do not infer
        // unpaid carts or exclude all newsletter readers who bought something.
        purchase: purpose === "newsletter" ? "not_applicable" : "unknown",
        frequency: "unknown", deduplication: "unknown", campaignConfigured: false });
      cohort.total += n;
      if (result.state === "excluded") cohort.excluded += n; else cohort.pending += n;
      for (const reason of result.reasons) cohort.reasons[reason] = (cohort.reasons[reason] ?? 0) + n;
      if (!Number.isSafeInteger(cohort.total)) throw new Error("Aggregate exceeds safe range");
    }
    cohorts.push(cohort);
  }
  return { schema: state, missingSources, cohorts, canSend: false };
}
