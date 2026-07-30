import { fetchAnalyticsReport } from "../lib/posthog-analytics";
import { formatAnalyticsReport } from "../lib/posthog-report-format";

async function main() {
  const windowDaysArg = process.argv[2];
  const windowDays = windowDaysArg ? Number(windowDaysArg) : 7;

  if (!Number.isFinite(windowDays) || windowDays <= 0) {
    console.error("Uso: npm run posthog:report -- [dias]  (dias debe ser un número positivo, default 7)");
    process.exit(1);
  }

  const report = await fetchAnalyticsReport(windowDays, new Date());
  console.log(formatAnalyticsReport(report));
}

main().catch((err) => {
  console.error("Falló la generación del reporte:", err instanceof Error ? err.message : err);
  process.exit(1);
});
