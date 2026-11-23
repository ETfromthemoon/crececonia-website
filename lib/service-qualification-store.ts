import "server-only";
import { createHash } from "node:crypto";
import { queryDatabase } from "./database";
import { parseQualification } from "./service-qualification";

export async function saveQualification(value: ReturnType<typeof parseQualification>) {
  const { requestId, ...payload } = value;
  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  // Database transaction owns both cross-instance quotas and retry identity.
  const rows = await queryDatabase<{ id: string | null; outcome: "saved" | "conflict" | "rate_limited" }>(
    `select * from commerce.register_service_qualification($1::uuid, $2, $3, $4::jsonb, $5)`,
    [requestId, value.service, value.email, JSON.stringify(payload), hash],
  );
  if (!rows[0]) throw new Error("Missing qualification persistence result");
  return rows[0];
}
