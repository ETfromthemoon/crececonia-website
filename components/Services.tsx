import { WAButton } from "./GradientButton";

const PRINCIPLES = [
  {
    label: "Pago contra entregables",
    body: "Nunca facturamos horas. Cada hito tiene una entrega concreta atada a su pago.",
  },
  {
    label: "Sin contrato anual",
    body: "Cada fase es independiente y cancelable. Solo seguimos si los entregables están a tu altura.",
  },
  {
    label: "El monto se define después del fit",
    body: "No publicamos planes con precio porque no creemos en cobrar por SKU. El monto depende del alcance, no del catálogo.",
  },
];

export default function Investment() {
  return (
    <section id="servicios" className="section-y px-6" style={{ background: "var(--graphite)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="tag mb-5 inline-block">Inversión</p>
          <h2
            className="font-light leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            El Test de Fit es gratuito.{" "}
            <em className="gradient-text">El resto depende del fit.</em>
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Si después del Test hay caso, los proyectos típicos van desde una
            auditoría profunda de 2 semanas hasta una implementación completa
            con acompañamiento de 90 días. El rango va de USD 500 a USD 5.000+
            según alcance, integraciones y volumen de datos.
          </p>
          <p
            className="text-base leading-relaxed mt-4"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
          >
            El monto exacto lo definimos juntos después del Test de Fit —
            nunca antes. Y nada se confirma hasta que tú apruebes el alcance
            y el presupuesto.
          </p>
        </div>

        {/* Principios de la inversión */}
        <div className="flex flex-col gap-4 mb-10">
          {PRINCIPLES.map((p) => (
            <div
              key={p.label}
              className="border flex gap-5 px-6 py-5"
              style={{
                borderRadius: 2,
                borderColor: "rgba(30,30,31,0.9)",
                background: "var(--carbon)",
              }}
            >
              <span
                className="flex-shrink-0"
                style={{
                  color: "var(--champagne)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginTop: 4,
                  minWidth: 16,
                }}
              >
                ✓
              </span>
              <div>
                <p
                  className="font-light text-base mb-1.5"
                  style={{ color: "var(--bone)" }}
                >
                  {p.label}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
                >
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Garantía destacada */}
        <div
          className="px-6 py-5 mb-10"
          style={{
            background: "rgba(217,179,106,0.06)",
            border: "1px solid rgba(217,179,106,0.28)",
            borderRadius: 2,
          }}
        >
          <p
            className="text-xs mb-2"
            style={{
              color: "var(--champagne)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Garantía
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Si en la semana 3 nadie en tu equipo está usando el sistema, lo
            iteramos sin costo hasta que lo hagan. La adopción es nuestro
            problema, no el tuyo.
          </p>
        </div>

        <div className="flex justify-start">
          <WAButton source="investment-cta" size="lg">
            Solicitar Test de Fit
          </WAButton>
        </div>
      </div>
    </section>
  );
}
