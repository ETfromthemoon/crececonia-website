import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogEntry, isCatalogEntryLive, isAdminPreviewKey } from "@/lib/ebook-catalog";
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
const RESOURCE = "ebook:agentes-de-ia";

export const metadata: Metadata = {
  title: "Agentes de IA para tu Negocio — Ebook · CrececonIA",
  description:
    "Automatiza tareas con agentes inteligentes que aprenden a trabajar por ti dentro de Claude. Para dueños de negocio, sin programar.",
  alternates: { canonical: `${SITE_URL}/ebook/agentes-de-ia` },
};

const SECTIONS = [
  {
    heading: "Parte 1 · Fundamentos",
    chapters: [
      { title: "Un agente real vs. un chatbot con humo", desc: "Cómo distinguir automatización de verdad del \"agent-washing\" que vende cualquiera." },
      { title: "Los 4 niveles de \"agente\"", desc: "De qué habla realmente cada proveedor cuando dice que su producto tiene agentes." },
    ],
  },
  {
    heading: "Parte 2 · Qué automatizar",
    chapters: [
      { title: "Qué NO automatizar", desc: "Las tareas donde un agente hace más daño que ayuda, y cómo reconocerlas antes de invertir tiempo." },
    ],
  },
  {
    heading: "Parte 3 · Diseño",
    chapters: [
      { title: "Arquitecturas de agentes", desc: "Los patrones que realmente se usan en producción, explicados sin jerga." },
      { title: "Construir vs. comprar", desc: "Cuándo conviene armar tu propio agente y cuándo conviene una herramienta ya hecha." },
    ],
  },
  {
    heading: "Parte 4 · Implementación",
    chapters: [
      { title: "Tu primer agente sin código", desc: "Un agente funcionando de punta a punta sin escribir una línea." },
      { title: "Agentes con n8n", desc: "Cómo conectar herramientas reales de tu negocio a un flujo automatizado." },
    ],
  },
  {
    heading: "Parte 5 · Seguridad y control",
    chapters: [
      { title: "Seguridad", desc: "Qué permisos darle a un agente y cuáles nunca, para no exponer tu negocio." },
      { title: "Humano en el bucle", desc: "Dónde dejar un punto de aprobación humana y dónde no hace falta." },
    ],
  },
  {
    heading: "Parte 6 · Medición",
    chapters: [
      { title: "Evaluación de resultados", desc: "Cómo saber si tu agente realmente está funcionando, no solo que \"corre\"." },
      { title: "Multiagente", desc: "Cuándo conviene que varios agentes trabajen coordinados en vez de uno solo." },
    ],
  },
  {
    heading: "Parte 7 · Ejecución",
    chapters: [
      { title: "Plan de 30 días", desc: "La secuencia exacta para pasar de cero a tu primer agente en producción." },
      { title: "Caso de negocio completo", desc: "Un caso real de punta a punta: del problema al agente funcionando." },
    ],
  },
];

const FAQS = [
  {
    q: "¿Necesito saber programar?",
    a: "No. Está escrito explícitamente para dueños de negocio sin experiencia técnica. El primer agente del libro se arma sin código.",
  },
  {
    q: "¿Qué trae además de los capítulos?",
    a: "21 capítulos en 7 partes, 7 anexos, y un caso de negocio completo documentado de punta a punta.",
  },
  {
    q: "¿En qué formato viene?",
    a: "PDF, con versión de escritorio (A4) y versión para celular incluidas en la misma compra.",
  },
  {
    q: "¿Me sirve si nunca usé Claude?",
    a: "Te va a servir más si ya tenés la base. Si es tu primera vez con Claude, sumá 'De cero a Claude en una semana' — juntos forman la Ruta Negocio.",
  },
  {
    q: "¿Tiene garantía?",
    a: "Sí. Si sientes que no valió la pena, escribime y te devuelvo lo que pagaste.",
  },
];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AgentesDeIAPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const entry = getCatalogEntry(RESOURCE);
  if (!entry || !entry.active) notFound();

  const params = await searchParams;
  const previewKey = typeof params.preview === "string" ? params.preview : undefined;
  const isPreview = isAdminPreviewKey(previewKey);

  if (!isCatalogEntryLive(entry) && !isPreview) {
    return (
      <main className="monad">
        <EbookComingSoon
          title="Agentes de IA."
          description="La guía para diseñar, automatizar y desplegar agentes de IA en tu negocio — sin la teoría de siempre. Disponible muy pronto."
          ghostWord="Agentes"
          ctaSource="ebook-agentes-ia-proximamente"
          resource={RESOURCE}
        />
      </main>
    );
  }

  const crossSellEntries = getCrossSellEntries(RESOURCE);
  const urlSelection = resolveBundleSelectionFromUrl(
    params,
    RESOURCE,
    crossSellEntries.map((e) => e.resource)
  );

  return (
    <main className="monad">
      <EbookCursorGlow />
      <EbookGenericHero
        resource={RESOURCE}
        eyebrow="Ebook · CrececonIA · Aplicación al negocio"
        title="Agentes de IA"
        titleAccent="para tu negocio."
        description="Automatiza tareas con agentes inteligentes que aprenden a trabajar por ti dentro de Claude. 137 páginas, para dueños de negocio, sin programar."
        coverSrc={entry.coverSrc}
        coverAlt="Portada del ebook Agentes de IA para tu Negocio"
      />

      <section className="section-y px-6">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <EbookSectionHeading kicker="Para quién es" align="left" maxWidth={720}>
            Para dueños de negocio.{" "}
            <em style={{ fontStyle: "italic" }}>No para programadores.</em>
          </EbookSectionHeading>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#000", lineHeight: 1.85 }}>
            Si tenés un negocio y sentís que hay tareas repetitivas que deberían resolverse solas,
            este libro es para vos. No asume que sabés programar — el primer agente lo armás sin
            código, siguiendo el libro paso a paso.
          </p>
        </div>
      </section>

      <EbookGenericTOC
        title={<>7 partes, 21 capítulos,{" "}<em style={{ fontStyle: "italic" }}>un caso real de punta a punta.</em></>}
        sections={SECTIONS}
      />

      <EbookPricing
        resource={RESOURCE}
        crossSellEntries={crossSellEntries}
        previewKey={previewKey}
        {...urlSelection}
      />
      <EbookGenericFAQ faqs={FAQS} />
    </main>
  );
}
