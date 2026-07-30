"use client";

import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";

/**
 * Se llama en el scope del módulo, no en un useEffect: los efectos de un
 * descendiente (ej. el "page view" de EbookPricing) se disparan ANTES que
 * el de este provider, porque React monta efectos de hijos primero. Si la
 * init viviera en un useEffect acá, el primer evento de cada página se
 * perdería siempre contra posthog.__loaded todavía en false. Ejecutar esto
 * al evaluar el módulo (que ocurre durante el render, no después) garantiza
 * que ya está inicializado para cuando el efecto de cualquier hijo corre.
 */
if (typeof window !== "undefined" && !posthog.__loaded) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  }
}

/**
 * Expone la instancia vía el provider oficial de posthog-js/react para que
 * useFeatureFlagVariantKey y demás hooks funcionen en los componentes hijos.
 * Sin NEXT_PUBLIC_POSTHOG_KEY configurada, posthog.__loaded queda en false y
 * lib/analytics.ts + los hooks tratan eso como "cliente no cargado", sin
 * romper build/dev.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>;
}
