import Image from "next/image";
import EvaluacionLink from "./EvaluacionLink";

const FACTS = [
  { value: "+30", label: "proyectos en producción" },
  { value: "7", label: "industrias" },
  { value: "4", label: "países" },
];

export default function SergioStory() {
  return (
    <section id="sergio" className="py-24 px-6" style={{ background: "var(--surface)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
          {/* Portrait */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div
              className="overflow-hidden flex-shrink-0 mx-auto md:mx-0 relative"
              style={{
                width: 260,
                aspectRatio: "4/5",
                borderRadius: 4,
                border: "1px solid rgba(217,179,106,0.15)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
              }}
            >
              <Image
                src="/sergio.jpg"
                alt="Sergio Astudillo — Consultor IA"
                fill
                className="object-cover object-top"
                sizes="260px"
                priority
              />
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4 mx-auto md:mx-0">
              <a
                href="mailto:sergio@crececonia.cl"
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em",
                }}
                aria-label="Email de contacto"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </a>
              <a
                href="https://www.linkedin.com/in/sergioastudillo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em",
                }}
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Contenido */}
          <div>
            <p
              className="text-xs mb-4"
              style={{
                color: "var(--champagne)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Quién está detrás
            </p>
            <h2
              className="font-light mb-6 leading-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                color: "var(--bone)",
              }}
            >
              Soy Sergio Astudillo.{" "}
              <em className="gradient-text">CrececonIA empezó por frustración.</em>
            </h2>

            <p
              className="text-base leading-relaxed mb-5"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Llevo 5+ años integrando sistemas de IA en empresas medianas. Vi
              demasiadas veces el mismo patrón: consultoras grandes entregando
              estrategias en PDF que nadie en la empresa terminaba usando, y
              agencias chicas vendiendo chatbots como si fueran soluciones a
              problemas operativos.
            </p>

            <p
              className="text-base leading-relaxed mb-5"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Mientras las Fortune 500 se gastan millones jugando con IA, las
              empresas medianas se quedan mirando — no por falta de necesidad,
              sino por falta de alguien que les hable claro y se haga cargo
              del resultado. Esa brecha es la que CrececonIA viene a cerrar.
            </p>

            <p
              className="text-base leading-relaxed mb-8"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Si llamas y tu empresa no necesita IA, te lo digo en la misma
              llamada y te recomiendo qué arreglar primero. Si ya lo intentaste
              y no viste valor, te explico por qué y si vale la pena retomarlo
              — o seguir adelante sin nosotros.{" "}
              <EvaluacionLink
                source="sergio-inline"
                className="font-semibold"
                style={{ color: "var(--champagne)", textDecoration: "underline" }}
              >
                Solicitar Test de Fit →
              </EvaluacionLink>
            </p>

            {/* Facts */}
            <div className="grid grid-cols-3 gap-4">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="text-center p-4 border"
                  style={{
                    borderRadius: 2,
                    borderColor: "rgba(30,30,31,0.9)",
                    background: "var(--carbon)",
                  }}
                >
                  <p
                    className="font-light text-2xl mb-1"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--bone)",
                      fontStyle: "italic",
                    }}
                  >
                    {fact.value}
                  </p>
                  <p
                    className="text-xs"
                    style={{
                      color: "var(--smoke)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
