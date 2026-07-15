"use client";

import { useEffect, useRef, useState } from "react";

const WHATSAPP_URL = "https://wa.me/56961945206?text=Quiero%20saber%20m%C3%A1s%20sobre%20los%20agentes%20IA";

const RESULTS = [
  {
    sector: "Restaurante",
    metric: "Tiempo de respuesta",
    impact: "−78%",
    fill: 78,
    description: "Agente WhatsApp responde reservas y consultas de carta 24/7. De 3 horas sin respuesta a 4 minutos promedio.",
    clientSize: "Restaurante ~25 empleados",
    timeToResult: "Visible en 2 semanas",
  },
  {
    sector: "Clínica dental",
    metric: "Citas agendadas sin llamar",
    impact: "+45%",
    fill: 45,
    description: "Agente web agenda consultas, confirma horarios y responde precios sin intervención humana.",
    clientSize: "Clínica 3 especialistas",
    timeToResult: "Mes 1 post go-live",
  },
  {
    sector: "Inmobiliaria",
    metric: "Leads calificados",
    impact: "+60%",
    fill: 60,
    description: "Agente Instagram filtra consultas de propiedades y agenda visitas con el corredor correcto.",
    clientSize: "Inmobiliaria ~15 empleados",
    timeToResult: "Visible en 3 semanas",
  },
  {
    sector: "E-commerce",
    metric: "Consultas post-venta",
    impact: "−70%",
    fill: 70,
    description: "Agente web + WhatsApp resuelve tracking, devoluciones y talles sin pasar por soporte humano.",
    clientSize: "Tienda online ~10 empleados",
    timeToResult: "Mes 1 post go-live",
  },
  {
    sector: "Servicios B2B",
    metric: "Tiempo de cotización",
    impact: "−65%",
    fill: 65,
    description: "Agente genera cotizaciones desde datos del cliente y las envía por WhatsApp en minutos.",
    clientSize: "Consultora ~8 empleados",
    timeToResult: "Visible en 2 semanas",
  },
  {
    sector: "Gimnasio",
    metric: "Renovaciones automáticas",
    impact: "+35%",
    fill: 35,
    description: "Agente WhatsApp sigue up a membresías por vencer, ofrece planes y cierra renovaciones.",
    clientSize: "Gimnasio ~12 empleados",
    timeToResult: "Mes 2 post go-live",
  },
];

function ResultCard({ result }: { result: (typeof RESULTS)[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="card-hover flex flex-col gap-3 p-7"
      style={{
        borderRadius: 2,
        background: "var(--card-bg)",
        border: "1px solid var(--hairline)",
      }}
    >
      <span
        className="tag"
      >
        {result.sector}
      </span>
      <p
        className="text-xs"
        style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em" }}
      >
        {result.metric}
      </p>
      <p
        className="gradient-text font-light leading-none"
        style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", fontStyle: "italic" }}
      >
        {result.impact}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)", fontWeight: 300 }}>
        {result.description}
      </p>
      <div className="progress-bar mt-1">
        <div
          className="progress-fill"
          style={{ width: visible ? `${result.fill}%` : "0%" }}
        />
      </div>
      <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
        <span
          className="text-xs"
          style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}
        >
          {result.clientSize}
        </span>
        <span
          className="text-xs px-2 py-0.5"
          style={{
            background: "var(--gold-soft)",
            color: "var(--champagne)",
            border: "1px solid rgba(196,155,74,0.15)",
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
  return (
    <section
      id="casos"
      className="section-y px-6 relative overflow-hidden"
      style={{ background: "var(--section-alt)" }}
    >
      <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          background: "radial-gradient(ellipse, rgba(196,155,74,0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="tag mb-5 inline-block">Casos reales</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            Negocios reales operando con agentes IA.{" "}
            <em className="gradient-text">Estos son los KPIs.</em>
          </h2>
          <p
            className="mt-4 text-sm max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.7 }}
          >
            Resultados medidos en producción. Sin proyecciones, sin humo.
            Empresas como la tuya que delegaron atención al cliente en un agente IA.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESULTS.map((r) => (
            <ResultCard key={r.sector} result={r} />
          ))}
        </div>

        <div className="text-center mt-12">
          <p
            className="text-sm mb-4"
            style={{
              color: "var(--muted)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.12em",
            }}
          >
            ¿Qué haría un agente IA en tu negocio?
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Hablar por WhatsApp →
          </a>
        </div>
      </div>
    </section>
  );
}
