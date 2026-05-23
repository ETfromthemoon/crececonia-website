"use client";
import { useEffect } from "react";

const API_BASE = "https://autodrive.cl";

export default function SkillViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    // Track only once per page load
    const key = `skill_view_tracked_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    fetch(`${API_BASE}/api/public/skills/${slug}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silent fail — métrica no crítica
    });
  }, [slug]);

  return null;
}
