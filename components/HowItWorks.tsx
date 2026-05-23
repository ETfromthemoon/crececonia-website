const STEPS = [
  {
    number: "01",
    duration: "30 min",
    title: "Revisamos tu operación",
    description:
      "Juntos, revisamos los 5 procesos que más tiempo consumen en tu negocio. Sin ventas, solo claridad.",
    deliverable: "Obtienes claridad sobre si vale la pena seguir y en qué área enfocarte.",
  },
  {
    number: "02",
    duration: "2 semanas",
    title: "Análisis y planificación",
    description:
      "Entrevistamos a tu equipo clave, mapeamos tus procesos y priorizamos según el retorno real de la inversión.",
    deliverable: "Obtienes un mapa priorizado y un estimado del retorno de la inversión por área de impacto.",
  },
  {
    number: "03",
    duration: "6–8 semanas",
    title: "Implementación y adopción",
    description:
      "Instalamos el sistema, lo integramos con tus herramientas existentes, capacitamos a tu equipo y medimos la adopción.",
    deliverable: "El sistema funciona y tienes métricas de adopción al cierre.",
  },
];

const TIMELINE_WEEKS = ["Semana 0", "Semana 2–3", "Semana 10–12"];

export default function Process() {
  return (
    <section id="proceso" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="tag mb-5 inline-block">Proceso</p>
          <h2
            className="font-light leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "var(--bone)",
            }}
          >
            Tres fases. Un solo objetivo:{" "}
            <em className="gradient-text">que funcione.</em>
          </h2>
          <p
            className="mt-4 text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300 }}
          >
            Sin contratos complicados. Cada fase tiene objetivos claros y medibles.
            Pagas por resultados, no por horas.
          </p>
        </div>

        {/* Timeline visual */}
        <div className="hidden md:flex items-center justify-between mb-10 px-8 relative">
          <div
            className="absolute top-3 left-8 right-8 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(217,179,106,0.3), rgba(217,179,106,0.3), transparent)" }}
            aria-hidden="true"
          />
          {TIMELINE_WEEKS.map((week, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className="w-6 h-6 flex items-center justify-center"
                style={{
                  background: "var(--carbon)",
                  border: `1px solid ${i === 1 ? "var(--champagne)" : "rgba(217,179,106,0.3)"}`,
                  borderRadius: 2,
                }}
              >
                <div
                  className="w-2 h-2"
                  style={{
                    background: i === 1 ? "var(--champagne)" : "rgba(217,179,106,0.4)",
                    borderRadius: 1,
                    transform: "rotate(45deg)",
                  }}
                />
              </div>
              <span
                className="text-xs"
                style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
              >
                {week}
              </span>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {STEPS.map((step, idx) => (
            <div
              key={step.number}
              className="card-hover border flex flex-col gap-4 overflow-hidden relative"
              style={{
                borderRadius: 2,
                borderColor: "rgba(30,30,31,0.9)",
                background: "var(--carbon)",
              }}
            >
              {/* Borde superior champagne */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 1,
                  background:
                    idx === 1
                      ? "linear-gradient(90deg, transparent, var(--champagne), transparent)"
                      : "linear-gradient(90deg, transparent, rgba(217,179,106,0.35), transparent)",
                  opacity: idx === 1 ? 0.8 : 0.4,
                }}
              />

              <div className="p-7 pt-8 flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="number-badge">{step.number}</div>
                  <span
                    className="text-xs px-3 py-1"
                    style={{
                      background: "var(--gold-soft)",
                      color: "var(--champagne)",
                      border: "1px solid rgba(217,179,106,0.18)",
                      borderRadius: 2,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {step.duration}
                  </span>
                </div>

                <div>
                  <h3
                    className="font-light mb-2 leading-snug"
                    style={{
                      color: "var(--bone)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.15rem",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--ash)", fontWeight: 300 }}
                  >
                    {step.description}
                  </p>
                </div>

                <div
                  className="mt-auto px-4 py-3 text-xs leading-relaxed"
                  style={{
                    background: "var(--gold-soft)",
                    border: "1px solid rgba(217,179,106,0.12)",
                    borderRadius: 2,
                    color: "var(--ash)",
                  }}
                >
                  <span style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
                    Resultado:{" "}
                  </span>
                  {step.deliverable}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
        >
          Pagas por resultados · Factura desde Chile (USD/CLP) · Sin contrato anual
        </p>
      </div>
    </section>
  );
}
