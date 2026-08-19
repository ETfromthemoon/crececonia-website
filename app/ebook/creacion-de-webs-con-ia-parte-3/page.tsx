import type { Metadata } from "next";
import EbookWebPartPage from "@/components/EbookWebPartPage";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  title: "Creación de Webs con IA · Parte 3: eCommerce — Ebook · CrececonIA",
  description: "Construye una tienda online con catálogo, carrito, checkout y pagos reales usando Next.js y ClaudeCode.",
  path: "/ebook/creacion-de-webs-con-ia-parte-3",
});

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <EbookWebPartPage resource="ebook:creacion-de-webs-con-ia-parte-3" searchParams={searchParams} />;
}
