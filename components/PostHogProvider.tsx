"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";
import PostHogEcosystemTracker from "./PostHogEcosystemTracker";
import { ensureAnalytics } from "@/lib/analytics-client";
import { analyticsAllowed } from "@/lib/analytics-privacy";

ensureAnalytics();

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    ensureAnalytics();
    if (posthog.__loaded) posthog.set_config({ advanced_disable_flags: !analyticsAllowed() });
  }, [pathname]);
  return <PostHogReactProvider client={posthog}><PostHogEcosystemTracker />{children}</PostHogReactProvider>;
}
