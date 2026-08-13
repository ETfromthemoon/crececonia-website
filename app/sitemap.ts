import type { MetadataRoute } from "next";
import { getLiveCatalogEntries } from "@/lib/ebook-catalog";
import { TEMAS } from "@/lib/temas";

const SITE_URL = "https://crececonia.cl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
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
  ];
  return [
    ...routes.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...TEMAS.map((tema) => ({
      url: `${SITE_URL}/centro/${tema.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...getLiveCatalogEntries().map((ebook) => ({
      url: `${SITE_URL}${ebook.href}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
