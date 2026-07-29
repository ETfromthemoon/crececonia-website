import { PostHog } from "posthog-node";

/**
 * Eventos server-side (route handlers de Flow) donde no hay browser/cliente
 * de PostHog disponible. posthog-node requiere shutdown() explícito por
 * request en entornos serverless — sin esto el evento puede perderse si la
 * función termina antes de flushearlo.
 */
export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown>
): Promise<void> {
  const key = process.env.POSTHOG_SERVER_KEY;
  if (!key) return;

  const client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
  });

  try {
    client.capture({ distinctId, event, properties });
  } finally {
    await client.shutdown();
  }
}
