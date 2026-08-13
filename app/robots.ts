import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended"],
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    host: "www.crececonia.cl",
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
