const UTM_KEYS = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]);
const PRIVATE_QUERY = /^(?:token|key|email|phone|tel|t|preview|access_token|authorization|secret)$/i;
const PRIVATE_PROPERTY = /(?:^|[_$])(?:token|key|email|phone|tel|authorization|secret|password)(?:$|_)/i;
const CONTACT_VALUE = /(?:mailto:|tel:|[^\s@]+@[^\s@]+\.[^\s@]+)/i;
const SEMANTIC_CTA_SOURCES: Record<string, ReadonlySet<string>> = {
  route_selector: new Set(["ia_selector"]),
  home_route: new Set(["home_hero", "home_footer"]),
  service_requirements: new Set(["service_hero"]),
  service_learning: new Set(["service_hero", "service_learning"]),
};

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
      if (UTM_KEYS.has(key) && item.length <= 200 && !CONTACT_VALUE.test(item)) safe.searchParams.append(key, item);
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
  if (!cta || !source || !Object.prototype.hasOwnProperty.call(SEMANTIC_CTA_SOURCES, cta) || !SEMANTIC_CTA_SOURCES[cta].has(source)) return undefined;
  return { cta, source };
}
