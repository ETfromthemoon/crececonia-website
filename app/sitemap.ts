import type { MetadataRoute } from "next";
import { getLiveCatalogEntries } from "@/lib/ebook-catalog";
import { getHubItems } from "@/lib/hub";
import { SITE_URL } from "@/lib/seo";
import { TEMAS } from "@/lib/temas";

export const revalidate = 3600;
const CONTENT_LAST_MODIFIED = new Date("2026-08-13T00:00:00.000-04:00");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
    { path: "", changeFrequency: "monthly", priority: 1.0 },
    { path: "/ia", changeFrequency: "monthly", priority: 0.7 },
    { path: "/aprender", changeFrequency: "monthly", priority: 0.9 },
    { path: "/mentoria", changeFrequency: "monthly", priority: 0.9 },
    { path: "/implementacion", changeFrequency: "monthly", priority: 0.9 },
    { path: "/protocolo-bpi", changeFrequency: "monthly", priority: 0.8 },
    { path: "/centro", changeFrequency: "weekly", priority: 0.8 },
    { path: "/centro/guias", changeFrequency: "weekly", priority: 0.7 },
    { path: "/centro/skills", changeFrequency: "weekly", priority: 0.7 },
    { path: "/centro/enlaces", changeFrequency: "weekly", priority: 0.6 },
    { path: "/ebooks", changeFrequency: "weekly", priority: 0.8 },
    { path: "/clase-en-vivo-2026-08-23", changeFrequency: "daily", priority: 0.9 },
    { path: "/workshop-en-vivo-2026-09-06", changeFrequency: "daily", priority: 1.0 },
  ];
  const hubItems = await getHubItems();
  const hubDetailRoutes = hubItems
    .filter((item) => item.tipo === "guia" || item.tipo === "skill")
    .map((item) => ({
      url: `${SITE_URL}${item.href}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const uniqueHubDetailRoutes = [...new Map(hubDetailRoutes.map((route) => [route.url, route])).values()];

  return [
    ...routes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...TEMAS.map((tema) => ({
      url: `${SITE_URL}/centro/${tema.id}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...getLiveCatalogEntries().map((ebook) => ({
      url: `${SITE_URL}${ebook.href}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...uniqueHubDetailRoutes,
  ];
}
