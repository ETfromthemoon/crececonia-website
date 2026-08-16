import posthog from "posthog-js";

export type AnalyticsProperties = Record<string, unknown>;

export type PageType =
  | "landing"
  | "ebooks"
  | "ebook"
  | "skill"
  | "guia"
  | "centro"
  | "servicio"
  | "contacto"
  | "otro";

export function getPageType(pathname: string): PageType {
  if (pathname === "/") return "landing";
  if (pathname === "/ebooks" || pathname.startsWith("/ebooks/")) return "ebooks";
  if (pathname.startsWith("/ebook/")) return "ebook";
  if (pathname.startsWith("/skills")) return "skill";
  if (pathname.startsWith("/guias")) return "guia";
  if (pathname.startsWith("/centro")) return "centro";
  if (["/ia", "/implementacion", "/mentoria", "/protocolo-bpi"].includes(pathname)) {
    return "servicio";
  }
  if (pathname === "/solicitar-llamada") return "contacto";
  return "otro";
}

function routeProperties(): AnalyticsProperties {
  if (typeof window === "undefined") return {};

  return {
    route: window.location.pathname,
    page_type: getPageType(window.location.pathname),
    analytics_schema_version: 1,
  };
}

/**
 * Eventos de producto y comportamiento que no son parte del funnel de ebooks.
 * Nunca se le pasan valores introducidos por el usuario: solo categorías,
 * conteos y estados.
 */
export function trackEvent(name: string, properties: AnalyticsProperties = {}): void {
  if (!posthog.__loaded) return;
  posthog.capture(name, { ...routeProperties(), ...properties });
}

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
