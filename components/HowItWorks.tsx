const STAGES = [
  {
    letter: "B",
    label: "Bases",
    question: "¿Tu data está accesible? ¿Tu equipo entiende sus propios procesos?",
    body: "Sin esto, ningún sistema de IA va a funcionar — porque no hay sobre qué construir. Las Bases son prerequisito de todo lo demás. Si tu empresa todavía está acá, lo más útil que podemos hacer es decírtelo y recomendarte por dónde empezar (que no somos necesariamente nosotros).",
  },
  {
    letter: "P",
    label: "Procesos",
    question: "¿El proceso que quieres automatizar tiene sentido como está?",
    body: "Muchas veces la &laquo;mejor IA&raquo; es rediseñar el proceso primero. Sin software adicional. Sin licencias nuevas. Sin pagar por capas de tecnología que tapan un problema operativo. Si tu proceso está roto, automatizarlo solo lo rompe más rápido.",
  },
  {
    letter: "I",
    label: "IA",
    question: "¿En qué procesos la IA realmente paga el costo total de propiedad?",
    body: "Solo cuando las Bases y los Procesos están sanos, evaluamos qué procesos pagan con IA y cuáles no. La mayoría no — y eso te lo decimos antes de cobrarte un peso. Cuando hay caso, instalamos el sistema, lo integramos, capacitamos y medimos adopción.",
  },
];

export default function BPIProtocol() {
  return (
    <section id="proceso" className="section-y px-6" style={{ background: "var(--graphite)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="tag mb-5 inline-block">Metodología propietaria</p>
          <h2
            className="font-light leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Protocolo BPI.{" "}
            <em className="gradient-text">Bases, Procesos, IA — en ese orden.</em>
          </h2>
          <p
            className="mt-4 text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
          >
            La mayoría de los proyectos de IA fallan porque saltan a la &laquo;I&raquo;
            cuando la empresa todavía está en la &laquo;B&raquo; o en la &laquo;P&raquo;.
            Antes de cobrarte por implementación, te decimos en qué letra estás.
          </p>
        </div>

        {/* Flujo B → P → I visual */}
        <div className="hidden md:flex items-center justify-center gap-4 mb-12">
          {["B", "P", "I"].map((letter, i) => (
            <div key={letter} className="flex items-center gap-4">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 4,
                  border: `1px solid ${i === 2 ? "var(--champagne)" : "rgba(217,179,106,0.3)"}`,
                  background:
                    i === 2 ? "rgba(217,179,106,0.08)" : "rgba(255,255,255,0.02)",
                  color: i === 2 ? "var(--champagne)" : "var(--bone)",
                  fontFamily: "var(--font-display)",
                  fontSize: "1.6rem",
                  fontWeight: 300,
                }}
              >
                {letter}
              </div>
              {i < 2 && (
                <span
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.1rem",
                    opacity: 0.6,
                  }}
                >
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {STAGES.map((stage, idx) => (
            <div
              key={stage.letter}
              className="card-hover border flex flex-col md:flex-row gap-6 p-7 relative overflow-hidden"
              style={{
                borderRadius: 2,
                borderColor:
                  idx === 2 ? "rgba(217,179,106,0.3)" : "rgba(30,30,31,0.9)",
                background: "var(--carbon)",
              }}
            >
              {/* Letra grande */}
              <div
                className="flex-shrink-0 flex md:flex-col items-center md:items-start gap-3 md:gap-1"
                style={{ minWidth: 96 }}
              >
                <span
                  className="leading-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "3.6rem",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color:
                      idx === 2 ? "var(--champagne)" : "rgba(231,229,221,0.85)",
                  }}
                >
                  {stage.letter}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: "var(--smoke)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {stage.label}
                </span>
              </div>

              <div className="flex-1">
                <p
                  className="text-base font-light leading-snug mb-3"
                  style={{ color: "var(--bone)", fontFamily: "var(--font-display)" }}
                >
                  {stage.question}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: stage.body }}
                />
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center text-xs mt-10"
          style={{
            color: "var(--smoke)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          El Test de Fit te dice en qué letra estás. Si no es la &laquo;I&raquo;, te lo
          decimos.
        </p>
      </div>
    </section>
  );
}
