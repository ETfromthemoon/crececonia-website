import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("workshop recorded-course schedule", () => {
  it("reintenta entregas futuras sin volver a enviar recordatorios del evento vencido", () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    const workshopCrons = config.crons.filter((cron) => cron.path.includes("/workshop-"));

    expect(workshopCrons).toEqual([
      { path: "/api/cron/workshop-delivery/initial", schedule: "7 12 * * *" },
    ]);
  });
});
