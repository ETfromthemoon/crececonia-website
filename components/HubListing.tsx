import Link from "next/link";
import HubCard from "@/components/HubCard";
import type { HubItem } from "@/lib/hub";

/** Listado por tipo dentro del Centro (/centro/guias, /centro/skills). */
export default function HubListing({
  eyebrow,
  titulo,
  descripcion,
  items,
  emptyLabel,
}: {
  eyebrow: string;
  titulo: string;
  descripcion: string;
  items: HubItem[];
  emptyLabel: string;
}) {
  return (
    <main className="min-h-screen" style={{ background: "var(--obsidian)", paddingTop: 112 }}>
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
              display: "block",
              width: "fit-content",
              margin: "0 auto 16px",
            }}
          >
            {eyebrow}
          </p>
          <h1
            className="font-light leading-tight mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "var(--bone)",
            }}
          >
            {titulo}
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--ash)", fontWeight: 300 }}>
            {descripcion}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>{emptyLabel}</p>
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
  );
}
