import "server-only";

const REQUIRED_WEBHOOK_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.bounced",
  "email.failed",
  "email.suppressed",
  "email.opened",
  "email.clicked",
];

type ResendDomain = { name?: string; status?: string };
type ResendWebhook = { endpoint?: string; status?: string; events?: string[] | null };

const normalizeEndpoint = (value: string) => value.replace(/\/+$/, "");

async function resendGet(path: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://api.resend.com${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

export async function getWorkshopEmailHealth() {
  const siteUrl = (process.env.SITE_URL ?? "https://www.crececonia.cl").replace(/\/+$/, "");
  const expectedEndpoint = `${siteUrl}/api/webhooks/resend`;
  const [domainsPayload, webhooksPayload] = await Promise.all([resendGet("/domains"), resendGet("/webhooks")]);
  const domains = (domainsPayload as { data?: ResendDomain[] } | null)?.data ?? [];
  const webhooks = (webhooksPayload as { data?: ResendWebhook[] } | null)?.data ?? [];
  const webhook = webhooks.find((candidate) => normalizeEndpoint(candidate.endpoint ?? "") === expectedEndpoint);
  const configuredEvents = new Set(webhook?.events ?? []);
  const missingWebhookEvents = REQUIRED_WEBHOOK_EVENTS.filter((event) => !configuredEvents.has(event));
  return {
    domainReady: domains.some((domain) => domain.name === "crececonia.cl" && domain.status === "verified"),
    webhookReady: Boolean(process.env.RESEND_WEBHOOK_SECRET) && webhook?.status === "enabled" && missingWebhookEvents.length === 0,
    webhookFound: Boolean(webhook),
    missingWebhookEvents,
  };
}
