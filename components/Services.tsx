import { WAButton } from "./GradientButton";

// TODO: confirmar precios reales con el consultor antes de publicar en producción
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

const FULL_FEATURES = [
  "Todo lo incluido en Implementación",
  "Sesiones quincenales durante 90 días",
  "Dashboard de adopción con métricas clave",
  "Reentrenamiento del equipo si la métrica baja",
  "Soporte prioritario por WhatsApp",
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
      <div className="max-w-6xl mx-auto">
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
            Tres formas de empezar.{" "}
            <em className="gradient-text">Misma metodología.</em>
          </h2>
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em" }}
          >
            Pago contra entregables · Factura desde Chile (USD/CLP) · Sin contrato anual
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Card 1: Auditoría Express */}
          <div
            className="card-hover border flex flex-col gap-5 p-8"
            style={{
              borderRadius: 2,
              borderColor: "rgba(30,30,31,0.9)",
              background: "var(--carbon)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="text-xs px-3 py-1"
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
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
                Tienes 20 ideas y necesitas claridad
              </p>
              <h3
                className="font-light text-xl mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Auditoría Express
              </h3>
              <p
                className="text-2xl font-light mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)", fontStyle: "italic" }}
              >
                USD 500
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
                Identificamos los 3 procesos de mayor impacto y te entregamos un plan de acción concreto.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {AUDIT_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--ash)" }}>
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
              <span style={{ color: "var(--champagne)" }}>Te llevas:</span> mapa priorizado con ROI estimado listo para ejecutar.
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
              boxShadow: "0 0 0 1px rgba(217,179,106,0.08), 0 24px 60px rgba(217,179,106,0.1)",
            }}
          >
            {/* Línea champagne superior */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, var(--champagne), transparent)",
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
              <p className="text-xs mb-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
                Sabes qué automatizar, falta ejecutar
              </p>
              <h3
                className="font-light text-xl mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Implementación
              </h3>
              <p
                className="text-2xl font-light mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--champagne)", fontStyle: "italic" }}
              >
                desde USD 1.200
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
                Instalamos el sistema, lo integramos con tus herramientas y aseguramos que tu equipo lo adopte de verdad.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {IMPL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--ash)" }}>
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
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

          {/* Card 3: Implementación + Adopción asistida */}
          <div
            className="card-hover border flex flex-col gap-5 p-8 relative overflow-hidden"
            style={{
              borderRadius: 2,
              borderColor: "rgba(140,111,63,0.25)",
              background: "var(--carbon)",
              boxShadow: "0 4px 24px rgba(140,111,63,0.06)",
            }}
          >
            {/* Línea superior dim */}
            <div
              className="absolute top-0 left-0 right-0"
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(217,179,106,0.4), transparent)",
                opacity: 0.4,
              }}
            />

            <div className="mt-1">
              <p className="text-xs mb-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
                Quieres garantizar adopción y medirla
              </p>
              <h3
                className="font-light text-xl mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
              >
                Implementación + 90 días
              </h3>
              <p
                className="text-2xl font-light mb-2"
                style={{ fontFamily: "var(--font-display)", color: "var(--bone)", fontStyle: "italic" }}
              >
                desde USD 3.000
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
                Todo lo de la implementación, más 90 días de acompañamiento para garantizar que el sistema se consolide.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5 flex-1">
              {FULL_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "var(--ash)" }}>
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div
              className="px-4 py-3 text-xs leading-relaxed"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid rgba(217,179,106,0.12)",
                borderRadius: 2,
                color: "var(--ash)",
              }}
            >
              <span style={{ color: "var(--champagne)" }}>Te llevas:</span>{" "}
              adopción medida &gt;70% al día 90, o iteramos sin costo adicional.
            </div>
            <WAButton source="svc-full" className="self-start">
              Empezar programa 90 días
            </WAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
