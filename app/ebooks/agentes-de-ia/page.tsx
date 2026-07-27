import type { Metadata } from "next";
import EbookComingSoon from "@/components/EbookComingSoon";

const SITE_URL = "https://www.crececonia.cl";

export const metadata: Metadata = {
  title: "Agentes de IA — Próximamente · Ebook CrececonIA",
  description:
    "Cómo diseñar, automatizar y desplegar agentes de IA en tu negocio o tu stack de desarrollo. Ebook en preparación — dejá tu contacto para enterarte cuando salga.",
  alternates: { canonical: `${SITE_URL}/ebooks/agentes-de-ia` },
  robots: { index: false, follow: true },
};

export default function AgentesDeIAPage() {
  return (
    <main className="monad">
      <EbookComingSoon
        title="Agentes de IA."
        description="La guía para diseñar, automatizar y desplegar agentes de IA en tu negocio o tu stack de desarrollo — sin la teoría de siempre. En preparación."
        ghostWord="Agentes"
        ctaSource="ebook-agentes-ia-proximamente"
        resource="ebook:agentes-de-ia"
      />
    </main>
  );
}
