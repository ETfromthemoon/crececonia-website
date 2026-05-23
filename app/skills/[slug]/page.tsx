import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import SkillViewTracker from "@/components/SkillViewTracker";
import PromptDemoBox from "@/components/PromptDemoBox";
import SkillDownloadGate from "@/components/SkillDownloadGate";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";

const API_BASE = "https://autodrive.cl";

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
  archivo_tipo: string;
  descargas_count: number;
  publicada: number;
  creado_en: string;
  // Workflow v2
  autor?: string;
  version?: string;
  cuando_usar?: string;
  cuando_no_usar?: string;
  prompt_template?: string;
  fuente_modulo?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  negocio: "Negocio",
  desarrollo: "Desarrollo",
  productividad: "Productividad",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchSkill(slug: string): Promise<Skill | null> {
  try {
    const r = await fetch(`${API_BASE}/api/public/skills/${slug}`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function fetchRelated(categoria: string, excludeSlug: string): Promise<Skill[]> {
  try {
    const r = await fetch(`${API_BASE}/api/public/skills?categoria=${categoria}`, { cache: "no-store" });
    if (!r.ok) return [];
    const all = (await r.json()) as Skill[];
    return all.filter((s) => s.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

function calcularTiempoLectura(texto: string): number {
  // 200 palabras por minuto promedio
  const palabras = (texto || "").split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const skill = await fetchSkill(slug);
  if (!skill) return { title: "Skill no encontrada" };
  return {
    title: `${skill.titulo} — Skills CrececonIA`,
    description: skill.descripcion_corta,
  };
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const skill = await fetchSkill(slug);
  if (!skill) notFound();

  const s = skill as Skill;
  const tiempoLectura = calcularTiempoLectura(s.descripcion_larga || s.descripcion_corta);
  const longHtml = s.descripcion_larga
    ? await marked.parse(s.descripcion_larga, { gfm: true, breaks: false })
    : `<p>${s.descripcion_corta}</p>`;
  const cuandoUsarHtml = s.cuando_usar
    ? await marked.parse(s.cuando_usar, { gfm: true, breaks: true })
    : "";
  const cuandoNoUsarHtml = s.cuando_no_usar
    ? await marked.parse(s.cuando_no_usar, { gfm: true, breaks: true })
    : "";
  const related = await fetchRelated(s.categoria, s.slug);

  const fechaPub = new Date(s.creado_en).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />
      <EmailPopup />
      <SkillViewTracker slug={s.slug} />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 112 }}>
        {/* ─── Breadcrumb ─── */}
        <div className="px-6 pt-10 pb-2 max-w-3xl mx-auto">
          <Link
            href="/skills"
            className="text-xs inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{
              color: "var(--smoke)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <span>←</span>
            <span>Todas las skills</span>
          </Link>
        </div>

        {/* ─── Hero ─── */}
        <header className="relative pt-12 pb-16 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(217,179,106,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-3xl mx-auto relative">
            {/* Meta superior */}
            <div className="flex items-center gap-3 mb-6 text-xs flex-wrap">
              <span
                className="px-2.5 py-1"
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
                {CATEGORY_LABELS[s.categoria] ?? s.categoria}
              </span>
              <span style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                {fechaPub}
              </span>
              <span style={{ color: "var(--smoke)" }}>·</span>
              <span style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                {tiempoLectura} min de lectura
              </span>
              {s.descargas_count > 0 && (
                <>
                  <span style={{ color: "var(--smoke)" }}>·</span>
                  <span style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                    {s.descargas_count} descarga{s.descargas_count !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>

            {/* Título grande tipo editorial */}
            <h1
              className="font-light mb-5 leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.4rem)",
                color: "var(--bone)",
              }}
            >
              {s.titulo}
            </h1>

            {/* Lead paragraph */}
            <p
              className="leading-relaxed"
              style={{
                color: "var(--ash)",
                fontWeight: 300,
                fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                lineHeight: 1.55,
              }}
            >
              {s.descripcion_corta}
            </p>

            {/* Tags */}
            {s.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--smoke)",
                      border: "1px solid rgba(30,30,31,0.9)",
                      borderRadius: 2,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA primario de descarga — visible sin scroll + captura email */}
            <div className="mt-8 flex items-center gap-4 flex-wrap">
              {s.archivo_nombre ? (
                <SkillDownloadGate
                  slug={s.slug}
                  archivoNombre={s.archivo_nombre}
                  archivoSize={s.archivo_size}
                  archivoTipo={s.archivo_tipo}
                />
              ) : (
                <p
                  className="text-xs px-3 py-2"
                  style={{
                    color: "var(--smoke)",
                    fontFamily: "var(--font-mono)",
                    border: "1px dashed rgba(217,179,106,0.25)",
                    borderRadius: 2,
                  }}
                >
                  Próximamente disponible para descarga
                </p>
              )}
            </div>
          </div>
        </header>

        {/* ─── Cuándo usar / Cuándo NO usar (workflow v2) ─── */}
        {(cuandoUsarHtml || cuandoNoUsarHtml) && (
          <section className="px-6 pb-8">
            <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
              {cuandoUsarHtml && (
                <div
                  className="p-5"
                  style={{
                    background: "var(--carbon)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 4,
                  }}
                >
                  <p className="text-xs mb-3" style={{ color: "rgb(165,180,252)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Cuándo usarla
                  </p>
                  <div className="skill-prose text-sm" dangerouslySetInnerHTML={{ __html: cuandoUsarHtml }} />
                </div>
              )}
              {cuandoNoUsarHtml && (
                <div
                  className="p-5"
                  style={{
                    background: "var(--carbon)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: 4,
                  }}
                >
                  <p className="text-xs mb-3" style={{ color: "rgb(252,211,77)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    Cuándo NO usarla
                  </p>
                  <div className="skill-prose text-sm" dangerouslySetInnerHTML={{ __html: cuandoNoUsarHtml }} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* ─── Prompt demo (visible sin colapsar — momento "wow") ─── */}
        {s.prompt_template && (
          <section className="px-6 pb-8">
            <div className="max-w-3xl mx-auto">
              <PromptDemoBox prompt={s.prompt_template} titulo={s.titulo} />
            </div>
          </section>
        )}

        {/* ─── Detalle completo (colapsable, default cerrado) ─── */}
        <section className="px-6 pb-10">
          <div className="max-w-3xl mx-auto">
            <details className="skill-collapse">
              <summary
                className="py-3 px-4 text-sm"
                style={{
                  background: "var(--carbon)",
                  border: "1px solid rgba(30,30,31,0.9)",
                  borderRadius: 4,
                  color: "var(--bone)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                }}
              >
                Leer el detalle completo
              </summary>
              <article className="mt-6">
                <div
                  className="skill-prose"
                  dangerouslySetInnerHTML={{ __html: longHtml }}
                />
              </article>
            </details>

            {/* Atribución compacta — 1 línea sutil */}
            {(s.autor || s.fuente_modulo || s.version) && (
              <p
                className="mt-8 text-xs"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.7,
                }}
              >
                {s.autor && <>Autor: <span style={{ color: "var(--ash)" }}>{s.autor}</span></>}
                {s.version && <> · v{s.version}</>}
                {s.fuente_modulo && <> · Fuente: <span style={{ color: "var(--ash)" }}>{s.fuente_modulo}</span></>}
              </p>
            )}
          </div>
        </section>

        {/* ─── Skills relacionadas ─── */}
        {related.length > 0 && (
          <section className="px-6 pb-16">
            <div className="max-w-3xl mx-auto">
              <p
                className="text-xs mb-6"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Más en {CATEGORY_LABELS[s.categoria] ?? s.categoria}
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/skills/${r.slug}`}
                    className="block group"
                    style={{
                      background: "var(--carbon)",
                      border: "1px solid rgba(30,30,31,0.9)",
                      borderRadius: 4,
                      padding: "16px",
                    }}
                  >
                    <p
                      className="font-light text-sm mb-1.5"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "var(--bone)",
                      }}
                    >
                      {r.titulo}
                    </p>
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "var(--smoke)" }}
                    >
                      {r.descripcion_corta}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
