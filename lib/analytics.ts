import posthog from "posthog-js";
import { ensureAnalytics } from "./analytics-client";
import {
  analyticsAllowed,
  sanitizeAnalyticsAttribution,
  sanitizeAnalyticsDistinctId,
  sanitizeAnalyticsProperties,
  type AnalyticsAttribution,
} from "./analytics-privacy";

export type AnalyticsProperties = Record<string, unknown>;
const EBOOK_ATTRIBUTION_STORAGE_KEY = "cc_ebook_utm_attribution";

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

function urlAttribution(): AnalyticsAttribution {
  const searchParams = new URLSearchParams(window.location.search);
  return sanitizeAnalyticsAttribution({
    utm_source: searchParams.get("utm_source"),
    utm_medium: searchParams.get("utm_medium"),
    utm_campaign: searchParams.get("utm_campaign"),
    utm_content: searchParams.get("utm_content"),
    utm_term: searchParams.get("utm_term"),
  });
}

function hasAttribution(attribution: AnalyticsAttribution): boolean {
  return Object.keys(attribution).length > 0;
}

/** Persist only the sanitized campaign allowlist, gated by analytics permission. */
function routeAttribution(): AnalyticsAttribution {
  if (typeof window === "undefined" || !analyticsAllowed()
      || (typeof posthog.is_capturing === "function" && !posthog.is_capturing())) return {};
  const current = urlAttribution();
  try {
    if (hasAttribution(current)) {
      window.sessionStorage?.setItem(EBOOK_ATTRIBUTION_STORAGE_KEY, JSON.stringify(current));
      return current;
    }
    const saved = window.sessionStorage?.getItem(EBOOK_ATTRIBUTION_STORAGE_KEY);
    return saved ? sanitizeAnalyticsAttribution(JSON.parse(saved)) : {};
  } catch {
    return current;
  }
}

function routeProperties(): AnalyticsProperties {
  if (typeof window === "undefined") return {};

  return {
    route: window.location.pathname,
    page_type: getPageType(window.location.pathname),
    analytics_schema_version: 1,
    ...routeAttribution(),
  };
}

/** Session campaign labels only; never returns the URL, click IDs, or contact data. */
export function getEbookAnalyticsAttribution(): AnalyticsAttribution {
  if (typeof window === "undefined" || !analyticsAllowed() || !posthog.__loaded
      || (typeof posthog.is_capturing === "function" && !posthog.is_capturing())) return {};
  return routeAttribution();
}

/**
 * Eventos de producto y comportamiento que no son parte del funnel de ebooks.
 * Nunca se le pasan valores introducidos por el usuario: solo categorías,
 * conteos y estados.
 */
export function trackEvent(name: string, properties: AnalyticsProperties = {}): void {
  if (!analyticsAllowed()) return;
  ensureAnalytics();
  if (!posthog.__loaded) return;
  posthog.capture(name, sanitizeAnalyticsProperties({ ...routeProperties(), ...properties }));
}

/**
 * Captura un evento del funnel de venta de ebooks solo si el cliente de
 * PostHog está inicializado (ver components/PostHogProvider.tsx). Sin
 * NEXT_PUBLIC_POSTHOG_KEY configurada, posthog-js nunca llega a
 * inicializarse y esta función es un no-op seguro.
 */
export function trackEbookEvent(name: string, properties: Record<string, unknown>): void {
  if (!analyticsAllowed()) return;
  ensureAnalytics();
  if (!posthog.__loaded) return;
  posthog.capture(name, sanitizeAnalyticsProperties({ ...routeProperties(), ...properties }));
}

/** Identificador anónimo del navegador para unir eventos cliente/servidor. */
export function getEbookAnalyticsDistinctId(): string | undefined {
  if (!analyticsAllowed()) return undefined;
  ensureAnalytics();
  if (!posthog.__loaded || (typeof posthog.is_capturing === "function" && !posthog.is_capturing())) return undefined;
  return sanitizeAnalyticsDistinctId(posthog.get_distinct_id());
}
