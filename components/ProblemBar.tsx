"use client";

import { useState } from "react";

const PROBLEMS = [
  {
    number: "01",
    title: "Licencias pagadas que no se utilizan.",
    summary: "Herramientas como Copilot, ChatGPT Enterprise o Gemini están activadas, pero el 80% del equipo no las ha abierto esta semana.",
    body: "El problema no es la herramienta en sí, sino que no se ha definido qué proceso específico va a mejorar, quién lo va a operar y cómo se mide el resultado. Sin eso, cualquier licencia se convierte en un gasto innecesario.",
    stat: "73% de licencias SaaS tienen adopción menor al 30%",
    source: "Gartner, 2024",
  },
  {
    number: "02",
    title: "Proyectos que comienzan con entusiasmo y mueren en 4 semanas.",
    summary: "La primera semana es de entusiasmo y demos, pero para la cuarta semana, nadie lo utiliza y nadie se atreve a mencionarlo.",
    body: "Las implementaciones fallan debido a la falta de contexto operacional, no por falta de tecnología. El sistema no entiende cómo trabaja tu equipo y tu equipo no entiende cómo funciona el sistema.",
    stat: "85% de proyectos de IA no llegan a producción",
    source: "McKinsey, 2023",
  },
  {
    number: "03",
    title: "20 procesos candidatos y sin claridad sobre por dónde empezar.",
    summary: "Cada gerente pide que se automatice su proceso, pero nadie ha medido cuál es el que realmente mueve el resultado.",
    body: "Sin una metodología de priorización, el presupuesto se fragmenta, los pilotos se multiplican y el impacto nunca es suficiente para justificar escalar.",
    stat: "Solo el 16% de empresas mide el ROI de sus iniciativas de IA",
    source: "Deloitte, 2024",
  },
  {
    number: "04",
    title: "Equipo que prefiere hacer las cosas a su manera.",
    summary: "El sistema está listo, pero la resistencia del equipo lo hace fracasar antes de dar resultados.",
    body: "La adopción no es un problema técnico, es un problema de diseño. Si el flujo de trabajo no se rediseña alrededor de la herramienta y el equipo no la ve como una ayuda, sino como una amenaza, el sistema fracasa aunque funcione perfectamente.",
    stat: "70% de las fallas de IA son de adopción, no de tecnología",
    source: "Harvard Business Review, 2024",
  },
];

export default function ProblemBar() {
  const [open, setOpen] = useState(0);

  return (
    <section id="problema" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <p
          className="text-xs mb-4"
          style={{
            color: "var(--champagne)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          El patrón de fallo
        </p>
        <h2
          className="font-light mb-4 leading-tight"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", color: "var(--bone)" }}
        >
          Si <em className="gradient-text">dos de estas cuatro</em> situaciones te resultan familiares, podemos ayudarte.
        </h2>
        <p className="text-base mb-12 leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
          No se trata de errores técnicos, sino de patrones de fallo que vemos en el 90% de las empresas que intentan adoptar IA sin una guía clara.
        </p>

        <div className="flex flex-col gap-3">
          {PROBLEMS.map((prob, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className="border transition-all duration-200"
                style={{
                  borderRadius: 2,
                  borderColor: isOpen ? "rgba(217,179,106,0.35)" : "rgba(30,30,31,0.9)",
                  background: isOpen ? "rgba(217,179,106,0.04)" : "var(--carbon)",
                  boxShadow: isOpen ? "0 4px 20px rgba(217,179,106,0.08)" : "none",
                }}
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-start gap-4"
                  onClick={() => setOpen(isOpen ? -1 : idx)}
                  aria-expanded={isOpen}
                >
                  <span
                    style={{
                      color: "var(--champagne)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.15em",
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  >
                    {prob.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-light text-base leading-snug mb-1" style={{ color: "var(--bone)" }}>
                      {prob.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ash)" }}>
                      {prob.summary}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 mt-1 transition-transform duration-300 text-xl leading-none"
                    style={{
                      color: "var(--smoke)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </button>

                <div
                  className="accordion-body px-6"
                  style={{ maxHeight: isOpen ? 320 : 0 }}
                >
                  <p className="text-sm leading-relaxed pb-4" style={{ color: "var(--ash)" }}>
                    {prob.body}
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs mb-4"
                    style={{
                      background: "var(--gold-soft)",
                      border: "1px solid rgba(217,179,106,0.18)",
                      borderRadius: 2,
                      color: "var(--champagne)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <span>{prob.stat}</span>
                    <span style={{ color: "var(--smoke)" }}>— {prob.source}</span>
                  </div>
                  <div className="mb-5">
                    <a
                      href="#proceso"
                      className="text-xs"
                      style={{
                        color: "var(--champagne)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      → Así lo resolvemos en 6 semanas
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
