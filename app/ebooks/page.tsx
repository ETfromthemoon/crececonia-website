import type { Metadata } from "next";
import EbookCard from "@/components/EbookCard";
import EbookSectionHeading from "@/components/EbookSectionHeading";

const SITE_URL = "https://www.crececonia.cl";

export const metadata: Metadata = {
  title: "Ebooks — CrececonIA",
  description:
    "Guías prácticas para dominar IA aplicada: Claude Code, agentes de IA, y más. Sin teoría — prompts, workflows y templates probados en producción.",
  alternates: { canonical: `${SITE_URL}/ebooks` },
};

const EBOOKS = [
  {
    title: "De cero a Claude en una semana",
    description:
      "La guía práctica para dominar Claude Code sin perder semanas probando. Instalación, prompts y workflows para producción en 150+ páginas.",
    href: "/ebook/de-cero-a-claude-en-una-semana",
    coverSrc: "/ebook-cover.png",
    status: "available" as const,
  },
  {
    title: "Agentes de IA",
    description:
      "Cómo diseñar, automatizar y desplegar agentes de IA en tu negocio o tu stack de desarrollo. En preparación.",
    href: "/ebooks/agentes-de-ia",
    status: "coming-soon" as const,
  },
];

export default function EbooksPage() {
  return (
    <main className="monad">
      <section className="section-y-spacious px-6">
        <div style={{ maxWidth: 1024, margin: "0 auto" }}>
          <EbookSectionHeading kicker="Biblioteca">
            Ebooks de <em style={{ fontStyle: "italic" }}>CrececonIA.</em>
          </EbookSectionHeading>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {EBOOKS.map((ebook, i) => (
              <EbookCard key={ebook.href} index={i} {...ebook} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
