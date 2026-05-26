const REFUSALS = [
  {
    headline: "Pilotos sin métricas de adopción.",
    body: "Si no medimos cuánto y cómo se usa el sistema en la semana 3, no es un proyecto — es un experimento que mañana nadie recuerda.",
  },
  {
    headline: "Estrategias en PDF.",
    body: "El paper-deliverable más bonito del mundo no resuelve un proceso roto. No entregamos documentos para tu archivo. Entregamos sistemas en producción.",
  },
  {
    headline: "Chatbots como solución a problemas operativos.",
    body: "Si tu problema real es que tu equipo no tiene contexto para vender, un chatbot no lo arregla — lo automatiza mal y a escala. Te lo decimos antes de cotizar.",
  },
  {
    headline: "Facturar horas en lugar de entregables.",
    body: "Las horas trabajadas son nuestro problema. Tu factura debe estar atada a hitos concretos: mapa entregado, sistema funcionando, adopción medida. Nunca a un timesheet.",
  },
  {
    headline: "Implementar IA cuando lo que necesitas son procesos.",
    body: "Volvemos al Protocolo BPI. Si estás en la &laquo;B&raquo; o en la &laquo;P&raquo;, te lo decimos. No te vendemos una &laquo;I&raquo; que va a fracasar para cobrar la fase 1.",
  },
];

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0, marginTop: 3, color: "var(--champagne)" }}
      aria-hidden="true"
    >
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function AntiPositioning() {
  return (
    <section
      id="no-hacemos"
      className="section-y px-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      <div className="relative max-w-3xl mx-auto">
        <div className="mb-14">
          <p className="eyebrow">Lo que NO hacemos</p>
          <h2
            className="font-light leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Cinco cosas que <em className="gradient-text">no tomamos.</em>
          </h2>
          <p
            className="text-base leading-relaxed max-w-2xl"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
          >
            Si lo que necesitas está en esta lista, no somos el proveedor correcto
            — y te lo decimos en el Test de Fit. Preferimos perder el proyecto
            antes que entregar algo que sabemos que no va a funcionar.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {REFUSALS.map((r) => (
            <div
              key={r.headline}
              className="border flex gap-4 px-6 py-5"
              style={{
                borderRadius: 2,
                borderColor: "rgba(30,30,31,0.9)",
                background: "var(--carbon)",
              }}
            >
              <XIcon />
              <div>
                <p
                  className="font-light text-base mb-2 leading-snug"
                  style={{ color: "var(--bone)" }}
                >
                  {r.headline}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: r.body }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
