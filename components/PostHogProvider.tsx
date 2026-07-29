"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";

/**
 * Inicializa posthog-js una sola vez, al montar, y expone la instancia vía
 * el provider oficial de posthog-js/react para que useFeatureFlagVariantKey
 * y demás hooks funcionen en los componentes hijos. Si no hay
 * NEXT_PUBLIC_POSTHOG_KEY configurada, no inicializa nada — lib/analytics.ts
 * y los hooks tratan eso como "cliente no cargado" y no capturan/resuelven
 * nada, sin romper build/dev.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
  }, []);

  return <PostHogReactProvider client={posthog}>{children}</PostHogReactProvider>;
}
