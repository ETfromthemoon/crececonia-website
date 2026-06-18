import type { Metadata } from "next";
import EbookHero from "@/components/EbookHero";
import EbookBenefits from "@/components/EbookBenefits";
import EbookTOC from "@/components/EbookTOC";
import EbookAuthor from "@/components/EbookAuthor";
import EbookPricing from "@/components/EbookPricing";
import EbookFAQ from "@/components/EbookFAQ";

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
      <div className="max-w-2xl mx-auto">
        <p className="eyebrow mb-5">El problema</p>
        <h2
          className="font-light leading-tight mb-8"
          style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
        >
          Claude es la herramienta más infravalorada del mercado.{" "}
          <em className="gradient-text">Y la documentación no ayuda.</em>
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <p
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.85 }}
          >
            La mayoría de las personas que prueban Claude lo usan como
            un ChatGPT glorificado. Piden cosas simples, obtienen respuestas
            genéricas, y concluyen que &quot;no es para mí&quot;. No es culpa
            de ellas — es que nadie les enseñó a usarlo bien.
          </p>
          <p
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.85 }}
          >
            La documentación oficial está escrita para ingenieros que ya saben
            lo que buscan. No hay una ruta clara de cero a productivo. Hay que
            armar el puzzle con blogs dispersos, videos desactualizados y meses
            de prueba y error.
          </p>
          <p
            style={{ color: "var(--bone)", fontWeight: 300, lineHeight: 1.85 }}
          >
            Este ebook condensa 6 meses de experimentación real con Claude Code
            en 120 páginas. La ruta que me habría gustado tener cuando empecé.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileCard({
  title,
  role,
  desc,
}: {
  title: string;
  role: string;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "var(--carbon)",
        border: "1px solid rgba(30,30,31,0.9)",
        borderRadius: 2,
        padding: "24px 22px",
      }}
    >
      <p
        style={{
          color: "var(--champagne)",
          fontSize: "0.7rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {role}
      </p>
      <h3
        className="font-light mb-3"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--bone)",
          fontSize: "1.05rem",
          lineHeight: 1.35,
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.75 }}
      >
        {desc}
      </p>
    </div>
  );
}

function EbookWhoIsFor() {
  return (
    <section className="section-y px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">Para quién es</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Si reconocés alguno de estos perfiles,{" "}
            <em className="gradient-text">este ebook es para vos.</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProfileCard
            role="Perfil 01"
            title="Dueño de PYME técnica"
            desc="Tenés equipo pero no tiempo para experimentar semanas con cada herramienta nueva. Querés saber si Claude realmente sirve y cómo integrarlo sin romper lo que ya funciona."
          />
          <ProfileCard
            role="Perfil 02"
            title="Freelance / Independiente"
            desc="Querés multiplicar tu output sin contratar. Claude puede ser el multiplicador de fuerza que te permite tomar más proyectos sin trabajar más horas."
          />
          <ProfileCard
            role="Perfil 03"
            title="Líder técnico"
            desc="Necesitás que tu equipo adopte IA sin caos ni dependencia ciega. Querés un marco claro para entender qué tareas tiene sentido darle a Claude y cuáles no."
          />
        </div>
      </div>
    </section>
  );
}

export default function EbookPage() {
  return (
    <main className="pt-28">
      <EbookHero />
      <EbookProblem />
      <EbookBenefits />
      <EbookWhoIsFor />
      <EbookTOC />
      <EbookAuthor />
      <EbookPricing />
      <EbookFAQ />
    </main>
  );
}
