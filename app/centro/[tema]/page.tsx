import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmailPopup from "@/components/EmailPopup";
import HubCard from "@/components/HubCard";
import { getHubItems, TIPO_LABEL, type HubTipo } from "@/lib/hub";
import { TEMAS_POR_ID, type TemaId } from "@/lib/temas";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIPOS: { id: HubTipo | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "skill", label: "Skills" },
  { id: "guia", label: "Guías" },
  { id: "enlace", label: "Links" },
];

function getTema(id: string) {
  return (TEMAS_POR_ID as Record<string, (typeof TEMAS_POR_ID)[TemaId]>)[id];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tema: string }>;
}): Promise<Metadata> {
  const { tema } = await params;
  const t = getTema(tema);
  if (!t) return { title: "Centro de Conocimiento — CrececonIA" };
  return {
    title: `${t.titulo} — Centro de Conocimiento · CrececonIA`,
    description: t.descripcion,
  };
}

export default async function TemaPage({
  params,
  searchParams,
}: {
  params: Promise<{ tema: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tema } = await params;
  const { tipo } = await searchParams;
  const t = getTema(tema);
  if (!t) notFound();

  const all = await getHubItems();
  const delTema = all.filter((it) => it.temas.includes(t.id));
  const tipoActivo: HubTipo | "todos" =
    tipo === "skill" || tipo === "guia" || tipo === "enlace" ? tipo : "todos";
  const items =
    tipoActivo === "todos" ? delTema : delTema.filter((it) => it.tipo === tipoActivo);

  // tipos con contenido en este tema (para no mostrar filtros vacíos)
  const tiposPresentes = new Set(delTema.map((it) => it.tipo));

  return (
    <>
      <Navbar />
      <EmailPopup />
      <main
        className="min-h-screen"
        style={{ background: "var(--obsidian)", paddingTop: 112 }}
      >
        {/* Header del tema */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(217,179,106,0.08) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative">
            <Link
              href="/centro"
              className="text-xs mb-4 inline-block transition-colors"
              style={{
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              ← Centro de Conocimiento
            </Link>
            <h1
              className="font-light leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "var(--bone)",
              }}
            >
              {t.titulo}
            </h1>
            <p
              className="text-base max-w-xl mx-auto"
              style={{ color: "var(--ash)", fontWeight: 300 }}
            >
              {t.descripcion}
            </p>
          </div>
        </section>

        {/* Sub-filtro por tipo */}
        <div className="px-6 pb-8">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
            {TIPOS.filter((tp) => tp.id === "todos" || tiposPresentes.has(tp.id as HubTipo)).map(
              (tp) => {
                const active = tipoActivo === tp.id;
                const href =
                  tp.id === "todos" ? `/centro/${t.id}` : `/centro/${t.id}?tipo=${tp.id}`;
                return (
                  <Link
                    key={tp.id}
                    href={href}
                    className="text-xs px-3 py-1.5 transition-colors"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      borderRadius: 2,
                      border: `1px solid ${active ? "var(--champagne)" : "rgba(30,30,31,0.9)"}`,
                      background: active ? "var(--gold-soft)" : "transparent",
                      color: active ? "var(--champagne)" : "var(--smoke)",
                    }}
                  >
                    {tp.label}
                  </Link>
                );
              },
            )}
          </div>
        </div>

        {/* Grid de items */}
        <section className="px-6 pb-24">
          <div className="max-w-6xl mx-auto">
            {items.length === 0 ? (
              <div className="text-center py-24">
                <p style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Próximamente · Estamos preparando contenido para este objetivo
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((it) => (
                  <HubCard key={`${it.tipo}-${it.slug}`} item={it} />
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
