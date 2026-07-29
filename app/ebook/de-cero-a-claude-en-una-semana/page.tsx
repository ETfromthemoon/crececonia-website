import type { Metadata } from "next";
import EbookHero from "@/components/EbookHero";
import EbookBenefits from "@/components/EbookBenefits";
import EbookTOC from "@/components/EbookTOC";
import EbookAuthor from "@/components/EbookAuthor";
import EbookPricing from "@/components/EbookPricing";
import EbookFAQ from "@/components/EbookFAQ";
import EbookImmersion from "@/components/EbookImmersion";
import EbookCursorGlow from "@/components/EbookCursorGlow";
import EbookSectionHeading from "@/components/EbookSectionHeading";
import EbookProfileCard from "@/components/EbookProfileCard";

const SITE_URL = "https://www.crececonia.cl";
const SLUG = "de-cero-a-claude-en-una-semana";

export const metadata: Metadata = {
  title: "De cero a Claude en una semana — Ebook · CrececonIA",
  description:
    "Guía práctica para dominar Claude Code en una semana. Setup, prompts, workflows y templates probados en producción. Por Sergio Astudillo.",
  alternates: { canonical: `${SITE_URL}/ebook/${SLUG}` },
  openGraph: {
    title: "De cero a Claude en una semana — Ebook",
    description:
      "Guía práctica para dominar Claude Code en una semana. Sin perder meses probando.",
    url: `${SITE_URL}/ebook/${SLUG}`,
    siteName: "CrececonIA",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/ebook-og.png",
        width: 1200,
        height: 630,
        alt: "Portada del ebook De cero a Claude en una semana",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "De cero a Claude en una semana — Ebook",
    description:
      "Guía práctica para dominar Claude Code en una semana.",
    images: ["/ebook-og.png"],
  },
};

function EbookProblem() {
  return (
    <section className="section-y px-6">
      <div style={{ maxWidth: 672, margin: "0 auto" }}>
        <EbookSectionHeading kicker="El problema" align="left" maxWidth={672}>
          Claude es la herramienta más infravalorada del mercado.{" "}
          <em style={{ fontStyle: "italic" }}>Y la documentación no ayuda.</em>
        </EbookSectionHeading>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            borderLeft: "2px solid rgba(207,218,245,0.9)",
            paddingLeft: 24,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "#4e4d4d",
              lineHeight: 1.85,
            }}
          >
            La mayoría de las personas que prueban Claude lo usan como
            un ChatGPT glorificado. Piden cosas simples, obtienen respuestas
            genéricas, y concluyen que &quot;no es para mí&quot;. No es culpa
            de ellas — es que nadie les enseñó a usarlo bien.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "#4e4d4d",
              lineHeight: 1.85,
            }}
          >
            La documentación oficial está escrita para ingenieros que ya saben
            lo que buscan. No hay una ruta clara de cero a productivo. Hay que
            armar el puzzle con blogs dispersos, videos desactualizados y meses
            de prueba y error.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "#000",
              lineHeight: 1.85,
            }}
          >
            Este ebook condensa 6 meses de experimentación real con Claude Code
            en 150+ páginas. La ruta que me habría gustado tener cuando empecé.
          </p>
        </div>
      </div>
    </section>
  );
}

const PROFILES = [
  {
    role: "Perfil 01",
    title: "Dueño de PYME técnica",
    desc: "Tienes equipo pero no tiempo para experimentar semanas con cada herramienta nueva. Quieres saber si Claude realmente sirve y cómo integrarlo sin romper lo que ya funciona.",
  },
  {
    role: "Perfil 02",
    title: "Freelance / Independiente",
    desc: "Quieres multiplicar tu output sin contratar. Claude puede ser el multiplicador de fuerza que te permite tomar más proyectos sin trabajar más horas.",
  },
  {
    role: "Perfil 03",
    title: "Líder técnico",
    desc: "Necesitas que tu equipo adopte IA sin caos ni dependencia ciega. Quieres un marco claro para entender qué tareas tiene sentido darle a Claude y cuáles no.",
  },
];

function EbookWhoIsFor() {
  return (
    <section className="section-y px-6">
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <EbookSectionHeading kicker="Para quién es">
          Si reconoces alguno de estos perfiles,{" "}
          <em style={{ fontStyle: "italic" }}>este ebook es para ti.</em>
        </EbookSectionHeading>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PROFILES.map((profile, i) => (
            <EbookProfileCard key={profile.role} index={i} {...profile} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function EbookPage() {
  return (
    <main className="monad">
      <EbookCursorGlow />
      <EbookHero />
      <EbookImmersion />
      <EbookProblem />
      <EbookBenefits />
      <EbookWhoIsFor />
      <EbookTOC />
      <EbookAuthor />
      <EbookPricing resource="ebook:de-cero-a-claude-en-una-semana" />
      <EbookFAQ />
    </main>
  );
}
