"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function SkillViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Track only once per page load
    const key = `skill_view_tracked_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackEvent("skill_viewed", { slug });

    fetch(`/api/public/skills/${slug}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silent fail — métrica no crítica
    });
  }, [slug]);

  return null;
}
