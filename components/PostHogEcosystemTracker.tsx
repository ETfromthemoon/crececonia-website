"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getPageType, trackEvent } from "@/lib/analytics";

const SCROLL_MILESTONES = [25, 50, 75, 90];

export default function PostHogEcosystemTracker() {
  const pathname = usePathname();
  const trackedMilestones = useRef(new Set<number>());

  useEffect(() => {
    if (typeof window === "undefined") return;

    trackedMilestones.current = new Set();
    const pageType = getPageType(pathname);
    const referrer = document.referrer;
    let referrerHost: string | undefined;
    try {
      referrerHost = referrer ? new URL(referrer).hostname : undefined;
    } catch {
      referrerHost = undefined;
    }

    trackEvent("ecosystem_page_view", {
      route: pathname,
      page_type: pageType,
      referrer_host: referrerHost,
    });

    const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target as HTMLElement;
          trackEvent("ecosystem_section_viewed", {
            section_id: section.id,
            page_type: pageType,
          });
          observer.unobserve(section);
        }
      },
      { threshold: 0.5 }
    );
    sections.forEach((section) => observer.observe(section));

    const onLinkClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target || target.dataset.analyticsIgnore === "true") return;
      let destinationType = "internal";
      let destinationHost: string | undefined;
      let destinationPath = target.getAttribute("href")?.split("?")[0] ?? "";
      try {
        const destination = new URL(target.href, window.location.href);
        destinationType = destination.origin === window.location.origin ? "internal" : "external";
        destinationHost = destination.hostname;
        destinationPath = destination.pathname;
      } catch {
        // Enlaces relativos incompletos no deben romper el tracking.
      }
      trackEvent("ecosystem_link_clicked", {
        destination_type: destinationType,
        destination_host: destinationHost,
        destination_path: destinationPath,
      });
    };

    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const percent = Math.round((window.scrollY / maxScroll) * 100);
      for (const milestone of SCROLL_MILESTONES) {
        if (percent < milestone || trackedMilestones.current.has(milestone)) continue;
        trackedMilestones.current.add(milestone);
        trackEvent("ecosystem_scroll_depth", { depth_percent: milestone, page_type: pageType });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onLinkClick);
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onLinkClick);
    };
  }, [pathname]);

  return null;
}
