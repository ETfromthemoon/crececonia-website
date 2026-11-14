import SellerPortal from "./SellerPortal";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";

export const dynamic = "force-dynamic";

export default function SellerPortalPage() {
  if (!marketplacePublicAvailable()) return <>
    <Navbar />
    <main className="site-container" style={{ minHeight: "70vh", maxWidth: 800, paddingTop: 150, paddingBottom: 100 }}>
      <p className="eyebrow">Marketplace de ebooks</p>
      <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", lineHeight: 1.05, margin: "22px 0" }}>Pronto, un espacio para autores.</h1>
      <p style={{ fontSize: "1.1rem", lineHeight: 1.7 }}>Estamos preparando la publicación de ebooks de IA, tecnología y negocios. Cada perfil y libro pasará por revisión antes de salir a la venta.</p>
      <p style={{ marginTop: 32 }}><Link href="/ebooks">Explorar los ebooks actuales →</Link></p>
    </main>
    <Footer />
  </>;
  return <SellerPortal demoAvailable={marketplaceDemoAvailable()} />;
}
