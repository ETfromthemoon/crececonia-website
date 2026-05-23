import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Herramientas gratis · CrececonIA",
  description: "Calculadoras y diagnósticos gratuitos para ver el impacto real de la IA en tu negocio. Sin registro, resultado inmediato.",
};

const TOOLS = [
  {
    href: "/horas-perdidas",
    icon: "📊",
    nombre: "¿Cuánto te roba ese proceso manual?",
    subtitulo: "Calculadora de costo oculto",
    descripcion: "Mové 3 sliders y te muestra cuánto dinero pierde tu equipo cada mes en tareas repetitivas. Con comparativos visuales (cafés, sueldos juniors, viajes).",
    tiempo: "2 min",
    accent: "rgba(217,179,106,0.25)",
  },
  {
    href: "/mi-voz",
    icon: "✏️",
    nombre: "Mi voz, no IA",
    subtitulo: "Generador de contenido con tu tono",
    descripcion: "Pegás 3 textos tuyos. Recibís 5 piezas nuevas (posts, emails, tweets) que suenan a vos, no a ChatGPT. Análisis del tono detectado incluido.",
    tiempo: "5 min",
    accent: "rgba(99,102,241,0.25)",
  },
  {
    href: "/calculadora-ia",
    icon: "🧠",
    nombre: "Calculadora de ROI con IA",
    subtitulo: "Para decisores que quieren números",
    descripcion: "Estimá el ahorro mensual y anual de automatizar un proceso. Reporte completo en PDF al email con el roadmap de cómo aplicarlo.",
    tiempo: "3 min",
    accent: "rgba(52,211,153,0.25)",
  },
  {
    href: "/evaluador-chat",
    icon: "💬",
    nombre: "Evaluador AI conversacional",
    subtitulo: "Diagnóstico fit + recomendación",
    descripcion: "10 preguntas en chat. Te devolvemos un análisis MEDDIC con score 0-45, fit estimado y qué servicio te conviene primero. Reporte PDF por email.",
    tiempo: "3 min",
    accent: "rgba(139,92,246,0.25)",
  },
];

export default function HerramientasPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 120 }}>
        <div className="max-w-5xl mx-auto px-6">
          {/* Hero */}
          <div className="text-center mb-20">
            <p
              className="text-xs mb-5"
              style={{
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Herramientas gratis · sin registro
            </p>
            <h1
              className="font-light mb-6 leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                color: "var(--bone)",
              }}
            >
              Probá el impacto antes de contratar
            </h1>
            <p
              className="max-w-2xl mx-auto leading-relaxed"
              style={{
                color: "var(--ash)",
                fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
                fontWeight: 300,
                lineHeight: 1.6,
              }}
            >
              4 mini-herramientas que te muestran qué puede hacer la IA por tu negocio.
              Resultados reales, no demos genéricas.
            </p>
          </div>

          {/* Grid 2x2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group block p-8 transition-all hover:translate-y-[-2px]"
                style={{
                  background: "var(--carbon)",
                  border: `1px solid ${tool.accent}`,
                  borderRadius: 4,
                  textDecoration: "none",
                }}
              >
                <div className="text-4xl mb-5" style={{ filter: "grayscale(0)" }}>
                  {tool.icon}
                </div>
                <p
                  className="text-xs mb-2"
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  {tool.subtitulo} · {tool.tiempo}
                </p>
                <h2
                  className="font-light mb-3 leading-tight"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
                    color: "var(--bone)",
                  }}
                >
                  {tool.nombre}
                </h2>
                <p
                  className="text-sm leading-relaxed mb-5"
                  style={{ color: "var(--ash)", lineHeight: 1.6 }}
                >
                  {tool.descripcion}
                </p>
                <span
                  className="text-xs inline-flex items-center gap-2 transition-all group-hover:gap-3"
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Probar ahora <span>→</span>
                </span>
              </Link>
            ))}
          </div>

          {/* CTA inferior */}
          <div
            className="mt-20 p-10 text-center"
            style={{
              background: "var(--carbon)",
              border: "1px solid rgba(30,30,31,0.9)",
              borderRadius: 4,
            }}
          >
            <p
              className="text-xs mb-3"
              style={{
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Ya viste los números — ¿hablamos?
            </p>
            <h3
              className="font-light mb-4"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                color: "var(--bone)",
                lineHeight: 1.3,
              }}
            >
              Auditoría Express USD 500 en 14 días
            </h3>
            <p
              className="max-w-xl mx-auto text-sm leading-relaxed mb-6"
              style={{ color: "var(--ash)", lineHeight: 1.6 }}
            >
              Si los cálculos te cerraron y querés un plan concreto, agendá tu Auditoría:
              3 oportunidades + ROI cuantificado + roadmap, en 14 días.
            </p>
            <Link
              href="/#servicios"
              className="inline-block py-3 px-8 font-medium transition-opacity hover:opacity-90"
              style={{
                background: "var(--champagne)",
                color: "var(--obsidian)",
                borderRadius: 2,
                fontSize: "0.95rem",
                textDecoration: "none",
              }}
            >
              Ver servicios →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
