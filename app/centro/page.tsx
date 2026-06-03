import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import CentroBrowser, { type TemaResumen } from "@/components/CentroBrowser";
import { getHubItems } from "@/lib/hub";
import { TEMAS } from "@/lib/temas";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centro de Conocimiento — CrececonIA",
  description:
    "Todo el conocimiento de Crececonia en un solo lugar: skills, guías y enlaces, organizados por objetivo. Encontrá lo que te sirve para crecer.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CentroPage() {
  const items = await getHubItems();

  const temas: TemaResumen[] = TEMAS.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    count: items.filter((it) => it.temas.includes(t.id)).length,
  }));

  return (
    <>
      <Navbar />
      <EmailPopup />
      <main
        className="min-h-screen"
        style={{ background: "var(--obsidian)", paddingTop: 112 }}
      >
        {/* Header */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,179,106,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative">
            <p
              className="text-xs mb-4 inline-block px-3 py-1"
              style={{
                color: "var(--champagne)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "1px solid rgba(217,179,106,0.2)",
                borderRadius: 2,
                background: "var(--gold-soft)",
              }}
            >
              Centro de Conocimiento
            </p>
            <h1
              className="font-light leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "var(--bone)",
              }}
            >
              Todo lo que sabemos,{" "}
              <em className="gradient-text" style={{ fontStyle: "italic" }}>
                en un solo lugar
              </em>
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "var(--ash)", fontWeight: 300 }}
            >
              Skills, guías y enlaces organizados por objetivo. Elegí qué querés
              lograr y encontrá lo que te sirve para crecer.
            </p>
          </div>
        </section>

        {/* Buscador + temas */}
        <CentroBrowser items={items} temas={temas} />
      </main>
      <Footer />
    </>
  );
}
