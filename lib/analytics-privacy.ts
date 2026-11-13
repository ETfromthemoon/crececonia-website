const UTM_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);
const UTM_KEY_LIST = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type AnalyticsAttribution = Partial<Record<(typeof UTM_KEY_LIST)[number], string>>;
const PRIVATE_QUERY = /^(?:token|key|email|phone|tel|t|preview|access_token|authorization|secret)$/i;
const PRIVATE_PROPERTY = /(?:^|[_$])(?:token|key|email|phone|tel|authorization|secret|password)(?:$|_)/i;
const CONTACT_VALUE = /(?:mailto:|tel:|[^\s@]+@[^\s@]+\.[^\s@]+)/i;
const POSTHOG_ANONYMOUS_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const URL_PREFIX = /^(?:\/|www\.)/i;
const DOMAIN_VALUE = /^(?:(?:[a-z0-9-]+\.)+[a-z]{2,}|localhost|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:[./?#]|$)/i;

function isPhoneLikeValue(value: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) || !/^[+\d\s().-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, "").length;
  return digits >= 9 && digits <= 15;
}

function isUrlLikeValue(value: string): boolean {
  return URL_SCHEME.test(value) || URL_PREFIX.test(value) || DOMAIN_VALUE.test(value);
}

/** Only copy bounded, non-contact UTM labels into analytics and order snapshots. */
export function sanitizeAnalyticsAttribution(value: unknown): AnalyticsAttribution {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const attribution: AnalyticsAttribution = {};
  for (const key of UTM_KEY_LIST) {
    const candidate = source[key];
    if (typeof candidate !== "string") continue;
    const normalized = candidate.trim();
    if (!normalized || normalized.length > 200 || CONTACT_VALUE.test(normalized) || isPhoneLikeValue(normalized)
        || isUrlLikeValue(normalized)) continue;
    attribution[key] = normalized;
  }
  return attribution;
}

/** PostHog's anonymous ID is UUIDv7; accept only that SDK-generated shape. */
export function sanitizeAnalyticsDistinctId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!POSTHOG_ANONYMOUS_ID.test(normalized)) return undefined;
  return normalized;
}
export const SEMANTIC_CTA_PAIRS = [
  { cta: "route_selector", source: "ia_selector" },
  { cta: "home_route", source: "home_hero" },
  { cta: "home_route", source: "home_footer" },
  { cta: "service_requirements", source: "service_hero" },
  { cta: "service_learning", source: "service_hero" },
  { cta: "service_learning", source: "service_learning" },
] as const;

export function isAllowedSemanticCta(cta: string, source: string): boolean {
  return SEMANTIC_CTA_PAIRS.some((pair) => pair.cta === cta && pair.source === source);
}

export function isAdminPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

/** Server-rendered marker distinguishes published launches from cookie previews. */
export function isPrivateAnalyticsUrl(value: string, publishedLaunchPath?: string): boolean {
  try {
    const url = new URL(value, "https://www.crececonia.cl");
    if (isAdminPath(url.pathname) || url.pathname.startsWith("/api/")
        || url.pathname === "/solicitar-llamada" || /\/(success|aula|sala)(\/|$)/.test(url.pathname)) return true;
    for (const key of url.searchParams.keys()) if (PRIVATE_QUERY.test(key)) return true;
    return url.pathname.startsWith("/lanzamientos/") && publishedLaunchPath !== url.pathname;
  } catch { return true; }
}

export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const marker = typeof document !== "undefined"
    ? document.querySelector("[data-analytics-public-launch]")?.getAttribute("data-analytics-public-launch") ?? undefined
    : undefined;
  return !isPrivateAnalyticsUrl(window.location.href, marker);
}

/** Only the analytics copy is changed; payment/download URLs stay untouched. */
export function sanitizeAnalyticsUrl(value: string): string | undefined {
  try {
    const url = new URL(value, "https://www.crececonia.cl");
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    const safe = new URL(url.origin + url.pathname);
    for (const [key, item] of url.searchParams) {
      const attribution = UTM_KEYS.has(key) ? sanitizeAnalyticsAttribution({ [key]: item }) : {};
      if (key in attribution) safe.searchParams.append(key, attribution[key as keyof AnalyticsAttribution]!);
    }
    return safe.toString();
  } catch { return undefined; }
}

/** Also covers nested $set/$set_once and old persisted URL properties. */
export function sanitizeAnalyticsProperties(value: Record<string, unknown>): Record<string, unknown> {
  const clean = (item: unknown, key = "", depth = 0): unknown => {
    if (depth > 12 || PRIVATE_PROPERTY.test(key) || /^(t|preview)$/i.test(key) || ["$elements", "$elements_chain", "$el_text", "$input_value"].includes(key)) return undefined;
    if (typeof item === "string") {
      if (item === "$direct" && /referrer$/i.test(key)) return item;
      if (/^(https?:\/\/|\/)/i.test(item) || /(?:url|href|referrer)$/i.test(key)) {
        const safe = sanitizeAnalyticsUrl(item);
        return safe && ["route", "destination_path", "$pathname"].includes(key) ? new URL(safe).pathname : safe;
      }
      if (CONTACT_VALUE.test(item)) return undefined;
      return item;
    }
    if (Array.isArray(item)) return item.map((entry) => clean(entry, "", depth + 1)).filter((entry) => entry !== undefined);
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([name, entry]) => [name, clean(entry, name, depth + 1)]).filter(([, entry]) => entry !== undefined));
    return item;
  };
  return clean(value) as Record<string, unknown>;
}

export function analyticsLinkDestination(href: string, base: string): Record<string, string> {
  try {
    const url = new URL(href, base);
    if (url.protocol === "mailto:" || url.protocol === "tel:") return { destination_type: "contact", contact_channel: url.protocol === "mailto:" ? "email" : "phone" };
    if (!["http:", "https:"].includes(url.protocol)) return { destination_type: "other" };
    return { destination_type: url.origin === new URL(base).origin ? "internal" : "external", destination_host: url.hostname, destination_path: url.pathname };
  } catch { return { destination_type: "other" }; }
}

/** Read only static, reviewed CTA labels from markup; never infer them from copy or URLs. */
export function analyticsSemanticCta(element: HTMLElement): { cta: string; source: string } | undefined {
  const cta = element.dataset.analyticsCta;
  const source = element.dataset.analyticsSource;
  if (!cta || !source || !isAllowedSemanticCta(cta, source)) return undefined;
  return { cta, source };
}
