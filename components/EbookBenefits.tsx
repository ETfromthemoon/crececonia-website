"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const BENEFITS = [
  {
    title: "Instalación en 30 minutos",
    desc: "Desde cero hasta tu primera sesión productiva con Claude Code. Sin horas de configuración ni documentación dispersa.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "Prompts que generan código real",
    desc: "Plantillas probadas en producción. No demos de laboratorio — prompts que funcionan en tu stack real, copiables al instante.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    title: "Workflows para tu stack",
    desc: "Cómo integrar Claude en PRs, tests, documentación y code review sin romper lo que ya funciona. Paso a paso.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    title: "Evitás meses de prueba y error",
    desc: "6 meses de experimentación real condensados. Los errores costosos ya los cometí yo — no los tenés que repetir.",
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function EbookBenefits() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="section-y px-6">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4e4d4d",
              marginBottom: 16,
            }}
          >
            Lo que vas a encontrar
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#000",
            }}
          >
            Todo lo que necesitás para{" "}
            <em style={{ fontStyle: "italic" }}>arrancar en serio.</em>
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.55,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              style={{
                background: "#cfdaf5",
                borderRadius: 40,
                padding: "40px",
                boxShadow: "rgba(0,0,0,0.1) 0px 0px 10px 0px",
              }}
            >
              <div style={{ color: "#242424", marginBottom: 18 }}>
                {b.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-serif-monad), Georgia, serif",
                  fontWeight: 400,
                  fontSize: "1.1rem",
                  lineHeight: 1.35,
                  color: "#000",
                  marginBottom: 10,
                }}
              >
                {b.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  lineHeight: 1.75,
                  color: "#4e4d4d",
                }}
              >
                {b.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
