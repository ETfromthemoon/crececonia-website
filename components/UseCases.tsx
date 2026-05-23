import Image from "next/image";
import EvaluacionLink from "./EvaluacionLink";

const FACTS = [
  { value: "+30", label: "proyectos en producción" },
  { value: "7", label: "industrias" },
  { value: "4", label: "países" },
];

export default function Authority() {
  return (
    <section className="py-20 px-6" style={{ background: "var(--surface)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-[300px_1fr] gap-12 items-start">
          {/* Portrait */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div
              className="overflow-hidden flex-shrink-0 mx-auto md:mx-0 relative"
              style={{
                width: 260,
                aspectRatio: "4/5",
                borderRadius: 12,
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
                href="mailto:hola@crececonia.cl"
                className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--muted)" }}
                aria-label="Email de contacto"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email
              </a>
            </div>
          </div>

          {/* Contenido */}
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: "var(--accent)" }}
            >
              Quién implementa
            </p>
            <h2
              className="font-bold mb-5 leading-tight"
              style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "var(--ink)" }}
            >
              Sergio Astudillo. Llevo 5+ años integrando sistemas en empresas medianas, trabajando de la mano con ellas.
            </h2>
            <p className="text-base leading-relaxed mb-3" style={{ color: "var(--muted)" }}>
              He trabajado en más de 30 proyectos en producción en 7 industrias distintas en LATAM y España. Mi enfoque es instalar procesos que tu equipo pueda utilizar de verdad.
            </p>
            <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
              Si en el diagnóstico no veo un caso claro para IA en tu empresa, te lo digo directamente y te recomiendo qué hacer primero.{" "}
              <EvaluacionLink source="usecases-inline" className="font-semibold" style={{ color: "var(--indigo)" }}>
                Recibir mi evaluación AI →
              </EvaluacionLink>
            </p>

            {/* Facts */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="text-center rounded-xl p-4 border"
                  style={{ borderColor: "var(--border)", background: "var(--card)" }}
                >
                  <p
                    className="font-bold text-2xl mb-1"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}
                  >
                    {fact.value}
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
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
