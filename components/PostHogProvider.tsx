"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PostHogReactProvider } from "posthog-js/react";
import PostHogEcosystemTracker from "./PostHogEcosystemTracker";
import { ensureAnalytics, syncAnalyticsPrivacy } from "@/lib/analytics-client";

ensureAnalytics();

function PrivacySync() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => { syncAnalyticsPrivacy(); }, [pathname, search]);
  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogReactProvider client={posthog}>
    <Suspense fallback={null}><PrivacySync /></Suspense>
    <PostHogEcosystemTracker />
    {children}
  </PostHogReactProvider>;
}
