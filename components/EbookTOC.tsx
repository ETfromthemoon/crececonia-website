"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import EbookSectionHeading from "./EbookSectionHeading";

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
    <section className="section-y px-6" style={{ background: "rgba(198,219,112,0.14)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <EbookSectionHeading kicker="Contenido">
          Lo que vas a aprender,{" "}
          <em style={{ fontStyle: "italic" }}>capítulo por capítulo.</em>
        </EbookSectionHeading>

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
              style={{ padding: "22px 0" }}
            >
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e4efb6",
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
              </div>
              {i < CHAPTERS.length - 1 && (
                <motion.div
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.06 + 0.15,
                    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                  }}
                  style={{
                    marginTop: 22,
                    height: 1,
                    background:
                      "linear-gradient(to right, rgba(113,134,65,0.45), rgba(0,0,0,0.08) 60%)",
                    transformOrigin: "left",
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
