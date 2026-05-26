import { WAButton } from "./GradientButton";
import EvaluacionLink from "./EvaluacionLink";

const AUDIT_FEATURES = [
  "Entrevistas con equipo clave y observación en campo",
  "Mapa de procesos candidatos a IA",
  "ROI estimado por área de impacto",
  "Hoja de ruta priorizada lista para ejecutar",
  "Reunión de presentación de resultados",
];

const IMPL_FEATURES = [
  "Integración con tus herramientas existentes",
  "Capacitación práctica para el equipo",
  "30 días de soporte post-lanzamiento",
  "Métricas de adopción e impacto al cierre",
  "Documentación operativa para tu equipo",
];

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginTop: 3, flexShrink: 0, color: "var(--champagne)" }}
    >
      <path
        d="M13.5 4L6.5 11.5L2.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Services() {
  return (
    <section id="servicios" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="tag mb-5 inline-block">Servicios</p>
          <h2
            className="font-light leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "var(--bone)",
            }}
          >
            Dos formas de empezar.{" "}
            <em className="gradient-text">Misma metodología.</em>
          </h2>
          <p
            className="mt-3 text-xs"
            style={{
              color: "var(--smoke)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
            }}
          >
            Pago contra entregables · Factura desde Chile (USD/CLP) · Sin contrato anual
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Card 1: Auditoría Express */}
          <div
            className="card-hover border flex flex-col gap-5 p-8"
            style={{
              borderRadius: 2,
              borderColor: "rgba(30,30,31,0.9)",
              background: "var(--carbon)",
            }}
          >
            <div>
              <span
                className="text-xs px-3 py-1 inline-block mb-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--smoke)",
                  border: "1px solid rgba(30,30,31,0.9)",
                  borderRadius: 2,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Auditoría · 2 semanas
              </span>
              <p
                className="text-xs mb-1"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.12em",
                }}
              >
                Tienes 20 ideas y necesitas claridad
              </p>
              <h3
                className="font-light text-xl mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Auditoría Express
              </h3>
              <p
                className="text-2xl font-light mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--bone)",
                  fontStyle: "italic",
                }}
              >
                USD 500
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
              >
                Identificamos los 3 procesos de mayor impacto y te entregamos un plan de
                acción concreto.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {AUDIT_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--ash)", lineHeight: 1.6 }}
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div
              className="px-4 py-3 text-xs leading-relaxed"
              style={{
                background: "var(--gold-soft)",
                color: "var(--ash)",
                border: "1px solid rgba(217,179,106,0.12)",
                borderRadius: 2,
              }}
            >
              <span style={{ color: "var(--champagne)" }}>Te llevas:</span> mapa priorizado
              con ROI estimado listo para ejecutar.
            </div>
            <WAButton source="svc-audit" className="self-start">
              Empezar con Auditoría
            </WAButton>
          </div>

          {/* Card 2: Implementación — DESTACADA */}
          <div
            className="card-hover flex flex-col gap-5 p-8 relative overflow-hidden"
            style={{
              borderRadius: 2,
              border: "1px solid rgba(217,179,106,0.3)",
              background: "linear-gradient(180deg, #131312 0%, var(--carbon) 100%)",
              boxShadow:
                "0 0 0 1px rgba(217,179,106,0.08), 0 24px 60px rgba(217,179,106,0.1)",
            }}
          >
            {/* Línea champagne superior */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--champagne), transparent)",
                opacity: 0.7,
              }}
            />

            {/* Badge "Más solicitado" */}
            <div
              className="absolute top-4 right-4 text-xs px-3 py-1"
              style={{
                background: "var(--champagne)",
                color: "var(--obsidian)",
                borderRadius: 2,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Más solicitado
            </div>

            {/* Orbe decorativo */}
            <div
              className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, rgba(217,179,106,0.1), transparent 70%)",
                filter: "blur(40px)",
                transform: "translate(30%, -30%)",
              }}
              aria-hidden="true"
            />

            <div className="mt-1">
              <p
                className="text-xs mb-1"
                style={{
                  color: "var(--smoke)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.12em",
                }}
              >
                Sabes qué automatizar, falta ejecutar
              </p>
              <h3
                className="font-light text-xl mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Implementación
              </h3>
              <p
                className="text-2xl font-light mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--champagne)",
                  fontStyle: "italic",
                }}
              >
                desde USD 1.500
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
              >
                Instalamos el sistema, lo integramos con tus herramientas y aseguramos que
                tu equipo lo adopte de verdad.
              </p>
            </div>

            <ul className="flex flex-col gap-2.5 flex-1">
              {IMPL_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--ash)", lineHeight: 1.6 }}
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            {/* Badge garantía */}
            <div
              className="px-4 py-3 text-xs leading-relaxed"
              style={{
                background: "rgba(217,179,106,0.06)",
                border: "1px solid rgba(217,179,106,0.28)",
                borderRadius: 2,
                color: "var(--ash)",
              }}
            >
              <span style={{ color: "var(--champagne)" }}>Garantía:</span>{" "}
              si en la semana 3 nadie en tu equipo usa el sistema, lo iteramos sin costo
              hasta que lo hagan.
            </div>

            <div
              className="px-4 py-3 text-xs leading-relaxed"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid rgba(217,179,106,0.15)",
                borderRadius: 2,
                color: "var(--ash)",
              }}
            >
              <span style={{ color: "var(--champagne)" }}>Te llevas:</span>{" "}
              sistema en producción y equipo capacitado en semanas, no meses.
            </div>

            <WAButton source="svc-impl" className="self-start">
              Empezar Implementación
            </WAButton>
          </div>
        </div>

        {/* Upgrade hint */}
        <p
          className="text-center text-xs mt-8"
          style={{
            color: "var(--smoke)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          ¿Necesitas acompañamiento extendido?{" "}
          <EvaluacionLink
            source="svc-90d"
            style={{ color: "var(--champagne)", textDecoration: "underline" }}
          >
            Pregunta por el programa de 90 días →
          </EvaluacionLink>
        </p>
      </div>
    </section>
  );
}
