import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogEntry, isCatalogEntryLive } from "@/lib/ebook-catalog";
import { getCrossSellEntries } from "@/lib/ebook-crossell";
import { resolveBundleSelectionFromUrl } from "@/lib/ebook-bundles";
import EbookComingSoon from "@/components/EbookComingSoon";
import EbookGenericHero from "@/components/EbookGenericHero";
import EbookGenericTOC from "@/components/EbookGenericTOC";
import EbookGenericFAQ from "@/components/EbookGenericFAQ";
import EbookPricing from "@/components/EbookPricing";
import EbookSectionHeading from "@/components/EbookSectionHeading";
import EbookCursorGlow from "@/components/EbookCursorGlow";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.crececonia.cl";
const RESOURCE = "ebook:creacion-de-webs-con-ia";

export const metadata: Metadata = {
  title: "Creación de Webs con IA · Parte 1 — Ebook · CrececonIA",
  description:
    "Diseña y lanza sitios web completos usando inteligencia artificial, sin escribir código desde cero. Proyecto real con Next.js y Claude Code.",
  alternates: { canonical: `${SITE_URL}/ebook/creacion-de-webs-con-ia` },
};

const SECTIONS = [
  {
    heading: "Parte I · Fundamentos (cap. 1-8)",
    chapters: [
      { title: "Setup del entorno", desc: "Todo lo que necesitás instalado antes de escribir el primer prompt." },
      { title: "Evitar el \"AI Slop\"", desc: "Por qué la mayoría de los sitios hechos con IA se ven genéricos, y cómo no caer en eso." },
      { title: "Dirección de arte", desc: "Definir un estilo visual concreto antes de generar una sola línea de código." },
      { title: "Prompting para diseño web", desc: "Cómo pedirle a Claude Code exactamente lo que necesitás, sin resultados genéricos." },
      { title: "Next.js vs. Astro: cuál elegir", desc: "Criterios reales para decidir el framework según el proyecto, no por moda." },
      { title: "TypeScript strict", desc: "Por qué conviene desde el día uno y cómo no se vuelve una traba." },
      { title: "Arquitectura modular", desc: "Organizar el proyecto para que crecer no signifique reescribir todo." },
      { title: "Metodología de iteraciones", desc: "El proceso repetible para pasar de un borrador a un sitio terminado." },
    ],
  },
  {
    heading: "Parte II · Proyecto AppFlow (cap. 9-12)",
    chapters: [
      { title: "Anatomía de una landing", desc: "Qué secciones tiene que tener y por qué, con el proyecto real AppFlow de ejemplo." },
      { title: "8 iteraciones reales documentadas", desc: "El proceso completo, paso a paso, de cómo se construyó AppFlow con Claude Code." },
      { title: "Formularios y captación de leads", desc: "Cómo conectar un formulario real a un flujo de captación funcional." },
    ],
  },
  {
    heading: "Parte III · Lanzamiento (cap. 13-16)",
    chapters: [
      { title: "SEO y Core Web Vitals", desc: "Lo mínimo indispensable para que el sitio se encuentre y cargue rápido." },
      { title: "Deploy y analítica", desc: "Publicar el sitio y saber qué está pasando una vez que está en producción." },
      { title: "A/B testing", desc: "Cómo probar variantes sin reescribir el sitio cada vez." },
      { title: "Legal básico y cookies", desc: "Lo elemental para no lanzar un sitio con problemas legales evitables." },
    ],
  },
];

const FAQS = [
  {
    q: "¿Necesito saber programar?",
    a: "Ayuda tener perfil técnico o semi-técnico — el libro usa Next.js y TypeScript real, con Claude Code como herramienta. Si nunca programaste, primero te conviene 'De cero a Claude en una semana' (ahí ves las bases de Claude Code que este libro da por sabidas).",
  },
  {
    q: "¿Esto es un curso completo de sitios web?",
    a: "Es la Parte 1: fundamentos, un proyecto real (AppFlow) y lanzamiento de una landing. Cubre exactamente lo que dice el título — no promete ecommerce, SaaS ni sitios corporativos, que quedan fuera del alcance de esta parte.",
  },
  {
    q: "¿Qué stack usa?",
    a: "Next.js, TypeScript strict, y Claude Code como asistente de desarrollo. Todo el proyecto de ejemplo (AppFlow) es código real, no pseudocódigo.",
  },
  {
    q: "¿En qué formato viene?",
    a: "PDF, con versión de escritorio (A4) y versión para celular incluidas en la misma compra.",
  },
  {
    q: "¿Tiene garantía?",
    a: "Sí. Si sientes que no valió la pena, escribime y te devuelvo lo que pagaste.",
  },
];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CreacionDeWebsConIAPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const entry = getCatalogEntry(RESOURCE);
  if (!entry || !entry.active) notFound();

  if (!isCatalogEntryLive(entry)) {
    return (
      <main className="monad">
        <EbookComingSoon
          title="Creación de Webs con IA."
          description="Diseña y lanza sitios web completos usando inteligencia artificial, sin escribir código desde cero. Disponible muy pronto."
          ghostWord="Webs"
          ctaSource="ebook-creacion-webs-proximamente"
          resource={RESOURCE}
        />
      </main>
    );
  }

  const crossSellEntries = getCrossSellEntries(RESOURCE);
  const urlSelection = resolveBundleSelectionFromUrl(
    await searchParams,
    RESOURCE,
    crossSellEntries.map((e) => e.resource)
  );

  return (
    <main className="monad">
      <EbookCursorGlow />
      <EbookGenericHero
        resource={RESOURCE}
        eyebrow="Ebook · CrececonIA · Vertical técnica · Parte 1"
        title="Creación de Webs"
        titleAccent="con IA."
        description="Diseña y lanza sitios web completos usando inteligencia artificial, sin escribir código desde cero. 70 páginas, con un proyecto real de principio a fin."
        coverSrc={entry.coverSrc}
        coverAlt="Portada del ebook Creación de Webs con IA"
      />

      <section className="section-y px-6">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <EbookSectionHeading kicker="Para quién es" align="left" maxWidth={720}>
            Perfil técnico o semi-técnico{" "}
            <em style={{ fontStyle: "italic" }}>que quiere construir de verdad.</em>
          </EbookSectionHeading>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#000", lineHeight: 1.85 }}>
            Este libro usa Claude Code como herramienta central de desarrollo — el Nivel 3 de{" "}
            <a href="/ebook/de-cero-a-claude-en-una-semana" style={{ color: "#8fa3d9", textDecoration: "underline" }}>
              De cero a Claude en una semana
            </a>{" "}
            cubre esa base. Si ya la manejás, arrancá directo acá.
          </p>
        </div>
      </section>

      <EbookGenericTOC
        title={<>16 capítulos, 3 partes,{" "}<em style={{ fontStyle: "italic" }}>un proyecto real de punta a punta.</em></>}
        sections={SECTIONS}
      />

      <EbookPricing resource={RESOURCE} crossSellEntries={crossSellEntries} {...urlSelection} />
      <EbookGenericFAQ faqs={FAQS} />
    </main>
  );
}
