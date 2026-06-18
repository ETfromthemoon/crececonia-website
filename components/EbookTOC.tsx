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
    <section className="section-y px-6" style={{ background: "rgba(207,218,245,0.18)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
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
            Contenido
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#000",
            }}
          >
            Lo que vas a aprender,{" "}
            <em style={{ fontStyle: "italic" }}>capítulo por capítulo.</em>
          </h2>
        </div>

        <div ref={ref}>
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
                padding: "22px 0",
                borderBottom: i < CHAPTERS.length - 1 ? "1px solid rgba(0,0,0,0.1)" : "none",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#cfdaf5",
                  borderRadius: 8,
                  color: "#242424",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 400,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-serif-monad), Georgia, serif",
                    fontWeight: 400,
                    color: "#000",
                    fontSize: "1rem",
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {ch.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.78rem",
                    color: "#4e4d4d",
                    lineHeight: 1.65,
                  }}
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
