import type { Metadata } from "next";
import EbookComingSoon from "@/components/EbookComingSoon";

const SITE_URL = "https://www.crececonia.cl";

export const metadata: Metadata = {
  title: "Curso de sitios web con IA — Próximamente · CrececonIA",
  description:
    "Curso completo de creación de sitios web con IA: landing corporativo y ecommerce, de cero a producción. En preparación — dejá tu contacto para enterarte cuando salga.",
  alternates: { canonical: `${SITE_URL}/ebooks/sitios-web-ia` },
  robots: { index: false, follow: true },
};

export default function SitiosWebIAPage() {
  return (
    <main className="monad">
      <EbookComingSoon
        title="Sitios web con IA."
        description="Curso completo de creación de sitios web con IA: landing corporativo y ecommerce, de cero a producción. En preparación."
        ghostWord="Sitios"
        ctaSource="ebook-sitios-web-ia-proximamente"
        resource="ebook:sitios-web-ia"
      />
    </main>
  );
}
