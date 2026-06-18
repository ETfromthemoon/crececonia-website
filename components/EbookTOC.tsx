"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const CHAPTERS = [
  {
    title: "¿Por qué Claude y no las otras IAs?",
    desc: "Qué hace diferente a Claude, por qué Code cambia todo, y para qué tipo de trabajo es la mejor opción hoy.",
  },
  {
    title: "Instalación y primera sesión productiva",
    desc: "Setup completo en 30 minutos: cuenta, API keys, editor y tu primer prompt que genera código real.",
  },
  {
    title: "Cómo piensa Claude (y cómo aprovecharlo)",
    desc: "El modelo mental que nadie te explica. Por qué algunos prompts funcionan y otros no, y cómo diseñarlos bien.",
  },
  {
    title: "Prompts que generan código que funciona",
    desc: "Estructura, contexto, instrucciones y límites. Las técnicas que uso en cada sesión de trabajo.",
  },
  {
    title: "Workflows con Claude Code",
    desc: "Cómo integrar Claude en pull requests, tests, documentación y code review sin romper tu flujo actual.",
  },
  {
    title: "Templates copiables para producción",
    desc: "Una colección de prompts listos para usar organizados por tarea: refactor, debug, tests, docs, arquitectura.",
  },
  {
    title: "Agentes y automatización: el siguiente nivel",
    desc: "Qué son los agentes de Claude, cómo configurarlos y cuándo tiene sentido usarlos en proyectos reales.",
  },
];

export default function EbookTOC() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="section-y px-6" style={{ background: "var(--graphite)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">Contenido</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Lo que vas a aprender,{" "}
            <em className="gradient-text">capítulo por capítulo.</em>
          </h2>
        </div>

        <div ref={ref} className="flex flex-col gap-1">
          {CHAPTERS.map((ch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              style={{
                display: "flex",
                gap: 20,
                padding: "20px 0",
                borderBottom: i < CHAPTERS.length - 1 ? "1px solid rgba(30,30,31,0.9)" : "none",
              }}
            >
              <div
                className="number-badge flex-shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(217,179,106,0.08)",
                  border: "1px solid rgba(217,179,106,0.2)",
                  borderRadius: 2,
                  color: "var(--champagne)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 400,
                  marginTop: 2,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <p
                  className="font-light mb-1"
                  style={{
                    color: "var(--bone)",
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    lineHeight: 1.4,
                  }}
                >
                  {ch.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--smoke)", fontWeight: 300, lineHeight: 1.7 }}
                >
                  {ch.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
