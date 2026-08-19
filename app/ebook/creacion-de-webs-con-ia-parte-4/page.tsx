import type { Metadata } from "next";
import EbookWebPartPage from "@/components/EbookWebPartPage";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Creación de Webs con IA · Parte 4: SaaS y Dashboards — Ebook · CrececonIA",
  description: "Construye aplicaciones SaaS con autenticación, datos en vivo y multi-tenancy usando Next.js y ClaudeCode.",
  path: "/ebook/creacion-de-webs-con-ia-parte-4",
});

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <EbookWebPartPage resource="ebook:creacion-de-webs-con-ia-parte-4" searchParams={searchParams} />;
}
