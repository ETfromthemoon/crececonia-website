import SellerPortal from "./SellerPortal";
import { redirect } from "next/navigation";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Publica tu ebook en CrececonIA",
  description: "Un espacio para autores de libros prácticos sobre IA, tecnología y negocios.",
  path: "/ebooks/vender",
});

export default async function SellerPortalPage({ searchParams }: { searchParams: Promise<{ registro?: string; panel?: string }> }) {
  if (!marketplacePublicAvailable()) redirect("/ebooks");
  const preview = marketplaceDemoAvailable();
  const params = await searchParams;
  return <SellerPortal demoAvailable={preview} showRegistration={params.registro === "demo"} showPanelPreview={preview && params.panel === "real"} />;
}
