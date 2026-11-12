import posthog, { type PostHogConfig } from "posthog-js";
import { analyticsAllowed, sanitizeAnalyticsProperties, sanitizeAnalyticsUrl } from "./analytics-privacy";

/** Initialize before child effects; private pages never initialize the SDK. */
export function ensureAnalytics(): void {
  if (!analyticsAllowed() || posthog.__loaded) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, analyticsConfig());
}

export function analyticsConfig(): Partial<PostHogConfig> {
  return {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: "history_change",
    capture_pageleave: "if_capture_pageview",
    autocapture: false,
    capture_dead_clicks: false,
    disable_session_recording: true,
    disable_external_dependency_loading: true,
    disable_surveys: true,
    disable_conversations: true,
    disable_product_tours: true,
    capture_performance: false,
    capture_exceptions: false,
    save_referrer: false,
    save_campaign_params: false,
    disable_capture_url_hashes: true,
    // loaded precedes RemoteConfigLoader. Omit advanced_disable_flags at init;
    // the SDK otherwise gives the original value precedence over set_config.
    person_profiles: "identified_only",
    respect_dnt: true,
    get_current_url: (url) => sanitizeAnalyticsUrl(url) ?? "",
    before_send: (event) => !event || !analyticsAllowed() ? null : { ...event, properties: sanitizeAnalyticsProperties(event.properties) },
    loaded: (client) => {
      // Remove only old browser attribution/person caches, preserving anonymous ID.
      // These keys are verified against posthog-js 1.407.7 persistence/flags source.
      for (const property of ["$initial_person_info", "$initial_referrer_info", "$initial_campaign_params", "$stored_person_properties", "$stored_group_properties"]) client.unregister(property);
      client.set_config({ advanced_disable_flags: !analyticsAllowed() });
      if (analyticsAllowed()) {
        client.reloadFeatureFlags();
      }
    },
  };
}

/** Called for pathname AND query changes, without changing the functional URL. */
export function syncAnalyticsPrivacy(): void {
  ensureAnalytics();
  if (!posthog.__loaded) return;
  const disabled = !analyticsAllowed();
  const wasDisabled = posthog.config.advanced_disable_flags;
  posthog.set_config({ advanced_disable_flags: disabled });
  if (wasDisabled && !disabled) posthog.reloadFeatureFlags();
}
