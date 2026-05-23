import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills para Claude Code — CrececonIA",
  description: "Colección de skills y agentes personalizados para Claude Code. Descarga e instala en segundos.",
};

const CATEGORY_LABELS: Record<string, string> = {
  negocio: "Negocio",
  desarrollo: "Desarrollo",
  productividad: "Productividad",
};

type Skill = {
  id: number;
  slug: string;
  titulo: string;
  descripcion_corta: string;
  descripcion_larga: string;
  categoria: string;
  tags: string[];
  archivo_nombre: string;
  archivo_size: number;
  descargas_count: number;
  publicada: number;
  creado_en: string;
};

const API_BASE = "https://autodrive.cl";

// Render dinámico siempre — evita cache stale al publicar skills nuevas
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchSkills(category?: string): Promise<Skill[]> {
  try {
    const url = category
      ? `${API_BASE}/api/public/skills?categoria=${encodeURIComponent(category)}`
      : `${API_BASE}/api/public/skills`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const skills = await fetchSkills(category);

  // Categorías visibles: extraídas de skills publicadas
  const categoriesPresentes = [...new Set(skills.map((s) => s.categoria))];
  // Si no hay filtro, también traer info de TODAS las categorías por si hay otras
  const allCategories = category ? await fetchSkills() : skills;
  const allCats = [...new Set(allCategories.map((s) => s.categoria))];

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
              Claude Code Skills
            </p>
            <h1
              className="font-light leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "var(--bone)",
              }}
            >
              Skills para{" "}
              <em className="gradient-text" style={{ fontStyle: "italic" }}>
                Claude Code
              </em>
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "var(--ash)", fontWeight: 300 }}
            >
              Habilidades listas para instalar en tu entorno de Claude Code.
              Descarga, copia y empieza a usarlas en segundos.
            </p>
          </div>
        </section>

        {/* Filters */}
        {allCats.length > 0 && (
          <div className="px-6 pb-8">
            <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
              <Link
                href="/skills"
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
                  href={`/skills?category=${cat}`}
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
                  {CATEGORY_LABELS[cat] ?? cat}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {!skills.length ? (
              <div className="text-center py-24">
                <p style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Próximamente · Estamos preparando las primeras skills
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
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

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
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
          {CATEGORY_LABELS[skill.categoria] ?? skill.categoria}
        </span>
        {skill.archivo_nombre && (
          <span style={{ color: "var(--smoke)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
            ↓ Descargable
          </span>
        )}
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
        {skill.titulo}
      </h3>
      <p
        className="text-sm leading-relaxed line-clamp-3"
        style={{ color: "var(--ash)", fontWeight: 300 }}
      >
        {skill.descripcion_corta}
      </p>

      {skill.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {skill.tags.slice(0, 3).map((tag) => (
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
        Ver detalle →
      </p>
    </Link>
  );
}
