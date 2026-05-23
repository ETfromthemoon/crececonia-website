"use client";

import { useEffect, useRef, useState } from "react";
import { WAButton } from "./GradientButton";

const RESULTS = [
  {
    sector: "Construcción",
    metric: "Tiempo de cotización",
    impact: "−62%",
    fill: 62,
    description: "Presupuestos automáticos: de 3 días a medio día.",
    clientSize: "Constructora ~120 empleados",
    timeToResult: "Visible en 3 semanas",
  },
  {
    sector: "Distribución",
    metric: "Errores en pedidos",
    impact: "−85%",
    fill: 85,
    description: "Validación automática contra inventario en tiempo real.",
    clientSize: "Distribuidora 200+ empleados",
    timeToResult: "Mes 2 post go-live",
  },
  {
    sector: "Servicios profesionales",
    metric: "Horas administrativas",
    impact: "−40%",
    fill: 40,
    description: "Automatización de reportes. 15h semanales recuperadas.",
    clientSize: "Consultora ~35 empleados",
    timeToResult: "Visible en 4 semanas",
  },
  {
    sector: "Manufactura",
    metric: "Tiempo de respuesta RFQ",
    impact: "−70%",
    fill: 70,
    description: "Cotizaciones técnicas generadas con datos de producción.",
    clientSize: "Manufacturera ~80 empleados",
    timeToResult: "Mes 1 post go-live",
  },
  {
    sector: "Retail",
    metric: "Conversión de leads",
    impact: "+35%",
    fill: 35,
    description: "Atención 24/7 con calificación automática de prospectos.",
    clientSize: "Retail ~50 empleados",
    timeToResult: "Visible en 6 semanas",
  },
  {
    sector: "Logística",
    metric: "Costo por envío",
    impact: "−28%",
    fill: 28,
    description: "Optimización de rutas y asignación de transportistas.",
    clientSize: "Logística ~150 empleados",
    timeToResult: "Mes 3 post go-live",
  },
];

const ALL_SECTORS = ["Todos", "Construcción", "Distribución", "Manufactura", "Servicios profesionales", "Retail", "Logística"];

function ResultCard({ result }: { result: (typeof RESULTS)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="card-hover-dark border flex flex-col gap-3 p-6"
      style={{
        borderRadius: 2,
        background: "var(--carbon)",
        border: "1px solid rgba(30,30,31,0.9)",
      }}
    >
      <span
        className="text-xs self-start px-2.5 py-1"
        style={{
          background: "var(--gold-soft)",
          color: "var(--champagne)",
          border: "1px solid rgba(217,179,106,0.18)",
          borderRadius: 2,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {result.sector}
      </span>
      <p
        className="text-xs"
        style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
      >
        {result.metric}
      </p>
      <p
        className="gradient-text font-light leading-none"
        style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontStyle: "italic" }}
      >
        {result.impact}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
        {result.description}
      </p>
      <div className="progress-bar mt-1">
        <div
          className="progress-fill"
          style={{ width: visible ? `${result.fill}%` : "0%" }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
        <span className="text-xs" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
          {result.clientSize}
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{
            background: "var(--gold-soft)",
            color: "var(--champagne)",
            border: "1px solid rgba(217,179,106,0.15)",
            borderRadius: 2,
            fontFamily: "var(--font-mono)",
          }}
        >
          {result.timeToResult}
        </span>
      </div>
    </div>
  );
}

export default function Results() {
  const [activeFilter, setActiveFilter] = useState("Todos");

  const filtered = activeFilter === "Todos"
    ? RESULTS
    : RESULTS.filter((r) => r.sector === activeFilter);

  return (
    <section
      id="resultados"
      className="py-24 px-6 relative overflow-hidden"
      style={{ background: "var(--obsidian)" }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-40" aria-hidden="true" />

      {/* Orbe champagne centrado */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          background: "radial-gradient(ellipse, rgba(217,179,106,0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      {/* Orbe champagne dim — inferior derecha */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "0%",
          right: "5%",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(140,111,63,0.1), transparent 70%)",
          filter: "blur(70px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="tag mb-5 inline-block">Resultados</p>
          <h2
            className="font-light leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "var(--bone)",
            }}
          >
            6 proyectos terminados con resultados medidos{" "}
            <em className="gradient-text">(2024–2026).</em>
          </h2>
          <p
            className="mt-4 text-sm max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--smoke)", fontWeight: 300 }}
          >
            KPIs reales de proyectos completados. Sin proyecciones inventadas.
          </p>
        </div>

        {/* Filtros por sector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ALL_SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setActiveFilter(sector)}
              className="text-xs px-3 py-1.5 transition-all"
              style={{
                borderRadius: 2,
                background: activeFilter === sector ? "var(--gold-soft)" : "rgba(255,255,255,0.03)",
                color: activeFilter === sector ? "var(--champagne)" : "var(--smoke)",
                border: `1px solid ${activeFilter === sector ? "rgba(217,179,106,0.3)" : "rgba(30,30,31,0.9)"}`,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {sector}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <ResultCard key={r.sector} result={r} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm mb-4" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}>
            ¿Te muestro cómo se vería el tuyo?
          </p>
          <WAButton source="results-cta" size="lg">
            Recibir mi evaluación AI →
          </WAButton>
        </div>
      </div>
    </section>
  );
}
