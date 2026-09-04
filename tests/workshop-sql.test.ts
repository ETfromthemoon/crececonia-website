import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = (name: string) => readFileSync(join(process.cwd(), "docs", "superpowers", "plans", name), "utf8");

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

  it("retira el tramo anterior con un estado admitido al subir el precio", () => {
    const controls = sql("2026-09-03-workshop-admin-sales-controls.sql");

    expect(controls).toMatch(/set status\s*=\s*'retired'/i);
    expect(controls).not.toMatch(/set status\s*=\s*'inactive'/i);
    expect(controls).toMatch(/amount_minor\s*\+\s*5000/i);
  });
});
