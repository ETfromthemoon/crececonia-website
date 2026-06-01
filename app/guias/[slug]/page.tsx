import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";

const API_BASE = "https://autodrive.cl";

type Guia = {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  contenido_md: string;
  tags: string[];
  vistas: number;
  creado_en: string;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchGuia(slug: string): Promise<Guia | null> {
  try {
    const r = await fetch(`${API_BASE}/api/public/recursos/${slug}`, { cache: "no-store" });
    if (!r.ok) return null;
    const data = await r.json();
    return (data.recurso ?? null) as Guia | null;
  } catch {
    return null;
  }
}

async function fetchRelated(categoria: string, excludeSlug: string): Promise<Guia[]> {
  try {
    const r = await fetch(`${API_BASE}/api/public/recursos?categoria=${encodeURIComponent(categoria)}`, { cache: "no-store" });
    if (!r.ok) return [];
    const data = await r.json();
    const all = (data.recursos ?? []) as Guia[];
    return all.filter((g) => g.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

function calcularTiempoLectura(texto: string): number {
  const palabras = (texto || "").split(/\s+/).length;
  return Math.max(1, Math.round(palabras / 200));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guia = await fetchGuia(slug);
  if (!guia) return { title: "Guía no encontrada" };
  return {
    title: `${guia.titulo} — Guías CrececonIA`,
    description: guia.descripcion,
  };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guia = await fetchGuia(slug);
  if (!guia) notFound();

  const g = guia as Guia;
  const tiempoLectura = calcularTiempoLectura(g.contenido_md || g.descripcion);
  const html = g.contenido_md
    ? await marked.parse(g.contenido_md, { gfm: true, breaks: false })
    : `<p>${g.descripcion}</p>`;
  const related = await fetchRelated(g.categoria, g.slug);

  const fechaPub = g.creado_en
    ? new Date(g.creado_en).toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <Navbar />
      <EmailPopup />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 112 }}>
        {/* Breadcrumb */}
        <div className="px-6 pt-10 pb-2 max-w-3xl mx-auto">
          <Link
            href="/guias"
            className="text-xs inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{
              color: "var(--smoke)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            <span>←</span>
            <span>Todas las guías</span>
          </Link>
        </div>

        {/* Hero */}
        <header className="relative pt-12 pb-12 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(217,179,106,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-3xl mx-auto relative">
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
                {g.categoria}
              </span>
              {fechaPub && (
                <span style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>{fechaPub}</span>
              )}
              <span style={{ color: "var(--smoke)" }}>·</span>
              <span style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                {tiempoLectura} min de lectura
              </span>
            </div>

            <h1
              className="font-light mb-5 leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.4rem)",
                color: "var(--bone)",
              }}
            >
              {g.titulo}
            </h1>

            <p
              className="leading-relaxed"
              style={{
                color: "var(--ash)",
                fontWeight: 300,
                fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                lineHeight: 1.55,
              }}
            >
              {g.descripcion}
            </p>

            {g.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6">
                {g.tags.map((tag) => (
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
          </div>
        </header>

        {/* Contenido completo (abierto) */}
        <section className="px-6 pb-12">
          <div className="max-w-3xl mx-auto">
            <article className="skill-prose" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-16">
          <div
            className="max-w-3xl mx-auto p-8 text-center"
            style={{
              background: "var(--carbon)",
              border: "1px solid rgba(217,179,106,0.2)",
              borderRadius: 6,
            }}
          >
            <p
              className="font-light mb-4"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--bone)" }}
            >
              ¿Quieres automatizar tu negocio con IA?
            </p>
            <a
              href="https://wa.me/56961945206"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs px-6 py-3 transition-opacity hover:opacity-90"
              style={{
                background: "var(--champagne)",
                color: "var(--obsidian)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                borderRadius: 2,
                fontWeight: 600,
              }}
            >
              Hablemos →
            </a>
          </div>
        </section>

        {/* Relacionadas */}
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
                Más en {g.categoria}
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/guias/${r.slug}`}
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
                      style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
                    >
                      {r.titulo}
                    </p>
                    <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--smoke)" }}>
                      {r.descripcion}
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
