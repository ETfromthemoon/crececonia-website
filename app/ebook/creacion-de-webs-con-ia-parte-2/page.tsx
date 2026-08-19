import type { Metadata } from "next";
import EbookWebPartPage from "@/components/EbookWebPartPage";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Creación de Webs con IA · Parte 2: Sitios Corporativos — Ebook · CrececonIA",
  description: "Construye sitios corporativos completos con Astro, CMS y multi-idioma usando ClaudeCode.",
  path: "/ebook/creacion-de-webs-con-ia-parte-2",
});

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <EbookWebPartPage resource="ebook:creacion-de-webs-con-ia-parte-2" searchParams={searchParams} />;
}
