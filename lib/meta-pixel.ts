export type MetaEventParameters = Record<string, string | number | string[] | undefined>;

declare global {
  interface Window {
    fbq?: (command: "track", eventName: string, parameters?: MetaEventParameters) => void;
  }
}

/** Registra un evento de navegador sólo si el píxel ya fue configurado. */
export function trackMetaEvent(eventName: string, parameters: MetaEventParameters = {}) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", eventName, parameters);
}
