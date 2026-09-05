import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = (name: string) => readFileSync(join(process.cwd(), "docs", "superpowers", "plans", name), "utf8");
const migrationSql = (name: string) =>
  readFileSync(join(process.cwd(), "database", "migrations", name), "utf8");

describe("migraciones SQL del workshop", () => {
  it("no vuelve a introducir la referencia ambigua de resource", () => {
    const bootstrap = sql("2026-08-31-workshop-2026-09-06.sql");
    const repair = sql("2026-09-03-workshop-delivery-repair.sql");

    expect(bootstrap).not.toMatch(/on conflict\s*\(\s*flow_token\s*,\s*resource\s*\)/i);
    expect(repair).not.toMatch(/on conflict\s*\(\s*flow_token\s*,\s*resource\s*\)/i);
    expect(bootstrap).toContain("#variable_conflict use_column");
    expect(repair).toContain("#variable_conflict use_column");
    expect(repair).toContain("requested.resource_value");
    expect(repair).toMatch(/create or replace function public\.grant_workshop_ebooks/i);
  });

  it("mantiene separados los rechazos permanentes de los fallos reintentables", () => {
    const repair = sql("2026-09-03-workshop-delivery-repair.sql");

    expect(repair).toContain("'suppressed'");
    expect(repair).toMatch(/suppress_workshop_checkout_recovery/i);
  });

  it("permite registrar el aviso interno de cada compra del workshop", () => {
    const repair = sql("2026-09-03-workshop-delivery-repair.sql");

    expect(repair).toContain("'admin-notification'");
    expect(repair).toMatch(/create or replace function public\.claim_workshop_delivery/i);
    expect(repair).toMatch(/grant execute on function public\.claim_workshop_delivery/i);
  });

  it("limita los recordatorios de checkout a uno diario por persona y los detiene antes del workshop", () => {
    const reminders = migrationSql("20260905_004_workshop_recovery_daily_reminders.up.sql");
    const rollback = migrationSql("20260905_004_workshop_recovery_daily_reminders.down.sql");

    expect(reminders).toMatch(/now\(\)\s*>=\s*timestamptz\s*'2026-09-06 17:00:00-03'/i);
    expect(reminders).toMatch(/select distinct on \(lower\(c\.email\)\)/i);
    expect(reminders).toMatch(/order by lower\(c\.email\), \(r\.id is not null\) desc, c\.created_at desc/i);
    expect(reminders).toMatch(/latest_per_email\.recovery_status = 'sent'/i);
    expect(reminders).toMatch(/latest_per_email\.sent_at <= now\(\) - interval '24 hours'/i);
    expect(reminders).toMatch(/where latest_per_email\.recovery_id is null/i);
    expect(rollback).toMatch(/c\.created_at >= now\(\) - interval '24 hours'/i);
    expect(rollback).not.toMatch(/recovery_status = 'sent'/i);
  });
});
