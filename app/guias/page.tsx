import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guías — CrececonIA",
  description:
    "Guías completas y prácticas: cómo sacarle el jugo a la IA, herramientas, prompts y procesos. Directo al grano.",
};

type Guia = {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  tags: string[];
  vistas: number;
  creado_en: string;
};

const API_BASE = "https://autodrive.cl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchGuias(category?: string): Promise<Guia[]> {
  try {
    const url = category
      ? `${API_BASE}/api/public/recursos?categoria=${encodeURIComponent(category)}`
      : `${API_BASE}/api/public/recursos`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    return (data.recursos ?? []) as Guia[];
  } catch {
    return [];
  }
}

export default async function GuiasPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const guias = await fetchGuias(category);
  const allGuias = category ? await fetchGuias() : guias;
  const allCats = [...new Set(allGuias.map((g) => g.categoria))];

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
              Recursos · Guías
            </p>
            <h1
              className="font-light leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "var(--bone)",
              }}
            >
              Guías{" "}
              <em className="gradient-text" style={{ fontStyle: "italic" }}>
                prácticas
              </em>
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "var(--ash)", fontWeight: 300 }}
            >
              Cómo sacarle el jugo a la IA, herramientas, prompts y procesos.
              Directo al grano, sin vueltas.
            </p>
          </div>
        </section>

        {/* Filters */}
        {allCats.length > 0 && (
          <div className="px-6 pb-8">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
              <Link
                href="/guias"
                className="text-xs px-3 py-1.5 transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  borderRadius: 2,
                  border: `1px solid ${!category ? "var(--champagne)" : "rgba(30,30,31,0.9)"}`,
                  background: !category ? "var(--gold-soft)" : "transparent",
                  color: !category ? "var(--champagne)" : "var(--smoke)",
                }}
              >
                Todas
              </Link>
              {allCats.map((cat) => (
                <Link
                  key={cat}
                  href={`/guias?category=${encodeURIComponent(cat)}`}
                  className="text-xs px-3 py-1.5 transition-colors"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderRadius: 2,
                    border: `1px solid ${category === cat ? "var(--champagne)" : "rgba(30,30,31,0.9)"}`,
                    background: category === cat ? "var(--gold-soft)" : "transparent",
                    color: category === cat ? "var(--champagne)" : "var(--smoke)",
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {!guias.length ? (
              <div className="text-center py-24">
                <p style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Próximamente · Estamos preparando las primeras guías
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {guias.map((guia) => (
                  <GuiaCard key={guia.id} guia={guia} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function GuiaCard({ guia }: { guia: Guia }) {
  return (
    <Link
      href={`/guias/${guia.slug}`}
      className="group block"
      style={{
        background: "var(--carbon)",
        border: "1px solid rgba(30,30,31,0.9)",
        borderRadius: 4,
        padding: "24px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className="text-xs px-2 py-0.5"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--champagne)",
            background: "var(--gold-soft)",
            border: "1px solid rgba(217,179,106,0.15)",
            borderRadius: 2,
          }}
        >
          {guia.categoria}
        </span>
      </div>

      <h3
        className="mb-2 font-light"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          color: "var(--bone)",
          lineHeight: 1.3,
        }}
      >
        {guia.titulo}
      </h3>
      <p
        className="text-sm leading-relaxed line-clamp-3"
        style={{ color: "var(--ash)", fontWeight: 300 }}
      >
        {guia.descripcion}
      </p>

      {guia.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {guia.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5"
              style={{
                color: "var(--smoke)",
                border: "1px solid rgba(30,30,31,0.9)",
                borderRadius: 2,
                fontFamily: "var(--font-mono)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p
        className="mt-5 text-xs"
        style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
      >
        Leer la guía →
      </p>
    </Link>
  );
}
