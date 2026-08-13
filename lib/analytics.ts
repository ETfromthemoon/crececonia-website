import posthog from "posthog-js";

/**
 * Captura un evento del funnel de venta de ebooks solo si el cliente de
 * PostHog está inicializado (ver components/PostHogProvider.tsx). Sin
 * NEXT_PUBLIC_POSTHOG_KEY configurada, posthog-js nunca llega a
 * inicializarse y esta función es un no-op seguro.
 */
export function trackEbookEvent(name: string, properties: Record<string, unknown>): void {
  if (!posthog.__loaded) return;
  posthog.capture(name, properties);
}

/** Identificador anónimo del navegador para unir eventos cliente/servidor. */
export function getEbookAnalyticsDistinctId(): string | undefined {
  if (!posthog.__loaded) return undefined;
  return posthog.get_distinct_id();
}
