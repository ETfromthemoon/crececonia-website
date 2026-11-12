import "server-only";
import { createHash } from "node:crypto";
import { queryDatabase } from "./database";
import { parseQualification } from "./service-qualification";

export async function saveQualification(value: ReturnType<typeof parseQualification>) {
  const { requestId, ...payload } = value;
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  // A conflicting retry may acknowledge the same payload, never replace a lead.
  const rows = await queryDatabase<{ id: string }>(
    `insert into commerce.service_qualifications (id, service, email, payload, payload_hash)
     values ($1::uuid, $2, $3, $4::jsonb, $5)
     on conflict (id) do update set payload_hash = commerce.service_qualifications.payload_hash
       where commerce.service_qualifications.payload_hash = excluded.payload_hash
     returning id`,
    [requestId, value.service, value.email, JSON.stringify(payload), hash],
  );
  return rows[0] ?? null;
}
