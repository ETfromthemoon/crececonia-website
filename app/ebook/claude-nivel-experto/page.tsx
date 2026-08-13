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
import EbookPageFrame from "@/components/EbookPageFrame";
import { getCurrentPrice } from "@/lib/ebook-pricing";

// Gating por hora de lanzamiento (visibleFrom en el catálogo) — no se puede
// prerenderizar en build time o la activación de las 20:50 nunca ocurriría
// sola. Ver el comentario de `visibleFrom` en lib/ebook-catalog.ts.
export const dynamic = "force-dynamic";

const SITE_URL = "https://www.crececonia.cl";
const RESOURCE = "ebook:claude-nivel-experto";

export const metadata: Metadata = {
  title: "Claude a Nivel Experto — Ebook · CrececonIA",
  description:
    "Las técnicas que usan los power users para dejar de conversar con Claude y ponerlo a trabajar solo. Delegación, contexto, orquestación multi-agente.",
  alternates: { canonical: `${SITE_URL}/ebook/claude-nivel-experto` },
};

const TOPICS = [
  { title: "Delegación real", desc: "Dejar de pedirle a Claude que responda y empezar a pedirle que resuelva de punta a punta." },
  { title: "Ingeniería de contexto", desc: "Qué información darle, cuándo y cómo, para que no tengas que corregirlo en cada mensaje." },
  { title: "Bucles con criterio de salida", desc: "Cómo diseñar ciclos de trabajo que Claude sabe cuándo terminar, sin supervisión constante." },
  { title: "Memoria y Skills", desc: "Configurar lo que Claude recuerda entre sesiones y las capacidades reutilizables que le sumás." },
  { title: "Orquestación de varios Claude", desc: "Coordinar más de una instancia trabajando en paralelo sobre el mismo problema." },
  { title: "Verificación con paneles", desc: "Cómo confirmar que el resultado es correcto sin revisar línea por línea vos mismo." },
  { title: "Diseñar un \"empleado digital\"", desc: "Armar un rol persistente con responsabilidades claras, no un prompt suelto." },
  { title: "Automatización segura", desc: "Dónde poner los límites para que la automatización no se te vaya de las manos." },
];

const FAQS = [
  {
    q: "¿Necesito el libro 'De cero a Claude' antes de este?",
    a: "Si ya usas Claude seguido, no. Este material es avanzado — no explica qué es un prompt ni cómo abrir Claude, va directo a las técnicas de power users. Si recién estás empezando, arrancá con 'De cero a Claude en una semana'.",
  },
  {
    q: "¿En qué formato viene?",
    a: "PDF, con versión de escritorio (A4) y versión para celular incluidas en la misma compra. Descarga inmediata al pagar.",
  },
  {
    q: "¿Qué trae además de los capítulos?",
    a: "12 capítulos, 3 bonos, un glosario y 16 prompts listos para copiar y adaptar a tu caso.",
  },
  {
    q: "¿Tiene garantía?",
    a: "Sí. Si sientes que no te sirvió, escribime y te devuelvo lo que pagaste.",
  },
];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ClaudeNivelExpertoPage({
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
      <EbookPageFrame currentResource={RESOURCE}>
        <EbookComingSoon
          title="Claude a Nivel Experto."
          description="Las técnicas que usan los power users para dejar de conversar con Claude y ponerlo a trabajar solo. Disponible muy pronto."
          ghostWord="Experto"
          ctaSource="ebook-claude-nivel-experto-proximamente"
          resource={RESOURCE}
        />
      </EbookPageFrame>
    );
  }

  const crossSellEntries = getCrossSellEntries(RESOURCE);
  const crossSellPrices = Object.fromEntries(await Promise.all(crossSellEntries.map(async (item) => [
    item.resource,
    (await getCurrentPrice(item.resource).catch(() => ({ price: item.tierPrices.regular }))).price,
  ])));
  const urlSelection = resolveBundleSelectionFromUrl(
    params,
    RESOURCE,
    crossSellEntries.map((e) => e.resource)
  );

  return (
    <EbookPageFrame currentResource={RESOURCE}>
      <EbookGenericHero
        resource={RESOURCE}
        eyebrow="Ebook · CrececonIA · Upgrade"
        title="Claude a Nivel"
        titleAccent="Experto."
        description="Las técnicas que usan los power users para dejar de conversar con Claude y ponerlo a trabajar solo. 71 páginas directas, sin relleno."
        coverSrc={entry.coverSrc}
        coverAlt="Portada del ebook Claude a Nivel Experto"
      />

      <section className="section-y px-6">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <EbookSectionHeading kicker="Antes de comprar" align="left" maxWidth={720}>
            Este material es avanzado.{" "}
            <em style={{ fontStyle: "italic" }}>No es para todos, y está bien así.</em>
          </EbookSectionHeading>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              borderLeft: "2px solid rgba(198,219,112,0.9)",
              paddingLeft: 24,
            }}
          >
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#000", lineHeight: 1.85 }}>
              Es para vos si ya usás Claude seguido y sentís que le podrías sacar más — que hoy lo
              usás como un chat glorificado en vez de ponerlo a trabajar solo.
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#4e4d4d", lineHeight: 1.85 }}>
              No es para vos si nunca usaste Claude. Este libro no explica qué es un prompt ni cómo
              abrirlo — arranca directo en delegación, contexto y orquestación. Si es tu primera vez,
              empezá por{" "}
              <a href="/ebook/de-cero-a-claude-en-una-semana" style={{ color: "#718641", textDecoration: "underline" }}>
                De cero a Claude en una semana
              </a>
              , la base de todo el catálogo.
            </p>
          </div>
        </div>
      </section>

      <EbookGenericTOC
        title={<>Lo que vas a aprender, <em style={{ fontStyle: "italic" }}>técnica por técnica.</em></>}
        sections={[{ heading: "12 capítulos · 3 bonos · glosario · 16 prompts", chapters: TOPICS }]}
      />

      <EbookPricing
        resource={RESOURCE}
        crossSellEntries={crossSellEntries}
        crossSellPrices={crossSellPrices}
        previewKey={previewKey}
        {...urlSelection}
      />
      <EbookGenericFAQ faqs={FAQS} />
    </EbookPageFrame>
  );
}
