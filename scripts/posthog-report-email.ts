import { Resend } from "resend";
import { fetchAnalyticsReport } from "../lib/posthog-analytics";
import { formatAnalyticsReport } from "../lib/posthog-report-format";

function parseDays(args: string[]): number {
  const value = args.find((arg) => /^\d+$/.test(arg));
  const days = value ? Number(value) : 7;

  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new Error("La ventana debe ser un número entero entre 1 y 90 días.");
  }

  return days;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.POSTHOG_REPORT_EMAIL_TO;
  const sender = process.env.POSTHOG_REPORT_EMAIL_FROM?.trim() || "CrececonIA <sergio@crececonia.cl>";
  const days = parseDays(process.argv.slice(2));

  if (!apiKey) throw new Error("RESEND_API_KEY no configurada.");
  if (!recipient) throw new Error("POSTHOG_REPORT_EMAIL_TO no configurada.");

  const report = await fetchAnalyticsReport(days, new Date());
  const text = formatAnalyticsReport(report);
  const html = [
    "<div style=\"font-family:Arial,sans-serif;line-height:1.5;max-width:760px\">",
    "<h1>Reporte de PostHog — revisión manual</h1>",
    `<p>Ventana analizada: últimos ${days} días. Este correo solo sugiere líneas de revisión; no modifica la página ni abre PRs.</p>`,
    `<pre style=\"white-space:pre-wrap;background:#f6f7f9;padding:16px;border-radius:8px\">${escapeHtml(text)}</pre>`,
    "</div>",
  ].join("");

  const { error } = await new Resend(apiKey).emails.send({
    from: sender,
    to: recipient,
    subject: `📊 PostHog — revisión manual (${days} días)`,
    text,
    html,
  });

  if (error) throw new Error(`Resend no pudo enviar el reporte: ${error.message}`);
  console.log("Reporte de PostHog enviado correctamente.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
