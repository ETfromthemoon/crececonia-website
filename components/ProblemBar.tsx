const PROBLEMS = [
  {
    number: "01",
    title: "Licencias pagadas que nadie abre.",
    body: "Copilot, ChatGPT Enterprise, Gemini — activadas, pagadas, olvidadas. El problema no es la herramienta: es que nadie definió qué proceso específico iba a mejorar, quién lo opera y cómo se mide. Sin eso, cada licencia es gasto puro.",
    stat: "73% de licencias SaaS tienen adopción menor al 30%",
    source: "Gartner, 2024",
  },
  {
    number: "02",
    title: "Proyectos que mueren en la semana 4.",
    body: "La primera semana es de demos y entusiasmo. La cuarta, nadie lo menciona. Las implementaciones no fallan por tecnología — fallan porque el sistema no entiende cómo trabaja tu equipo y tu equipo no entiende cómo funciona el sistema.",
    stat: "85% de proyectos de IA no llegan a producción",
    source: "McKinsey, 2023",
  },
  {
    number: "03",
    title: "20 candidatos y sin claridad por dónde empezar.",
    body: "Cada gerente quiere automatizar su proceso. Sin priorización real, el presupuesto se fragmenta, los pilotos se multiplican y el impacto nunca justifica escalar. El costo no es solo dinero — es tiempo de tu equipo en cosas que no avanzan.",
    stat: "Solo 16% de empresas mide el ROI de sus iniciativas de IA",
    source: "Deloitte, 2024",
  },
  {
    number: "04",
    title: "El sistema funciona. El equipo no lo usa.",
    body: "La resistencia al cambio no se resuelve con más capacitación — se resuelve con diseño. Si el flujo de trabajo no se rediseña alrededor de la herramienta y el equipo no la percibe como ayuda, el sistema muere aunque funcione perfectamente.",
    stat: "70% de las fallas de IA son de adopción, no de tecnología",
    source: "Harvard Business Review, 2024",
  },
];

export default function ProblemBar() {
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
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
            color: "var(--bone)",
          }}
        >
          Si <em className="gradient-text">dos de estas cuatro</em> situaciones te resultan
          familiares, podemos ayudarte.
        </h2>
        <p
          className="text-base mb-12 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300 }}
        >
          No son errores técnicos. Son patrones de fallo que vemos en 9 de cada 10 empresas
          que intentan adoptar IA sin una guía clara.
        </p>

        <div className="flex flex-col gap-3">
          {PROBLEMS.map((prob) => (
            <div
              key={prob.number}
              className="border flex flex-col gap-3 px-6 py-5"
              style={{
                borderRadius: 2,
                borderColor: "rgba(30,30,31,0.9)",
                background: "var(--carbon)",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.15em",
                    marginTop: 3,
                    flexShrink: 0,
                  }}
                >
                  {prob.number}
                </span>
                <div className="flex-1">
                  <p
                    className="font-light text-base leading-snug mb-2"
                    style={{ color: "var(--bone)" }}
                  >
                    {prob.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
                  >
                    {prob.body}
                  </p>
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs self-start"
                style={{
                  marginLeft: "1.6rem",
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
