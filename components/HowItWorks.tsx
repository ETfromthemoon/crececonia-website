"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: 1,
    title: "Cuéntanos de tu negocio",
    body: "Una videollamada de 30 minutos. Entendemos cómo operas, qué preguntas te hacen siempre, y si un agente realmente te va a servir. Si no, te lo decimos sin cobrarte.",
  },
  {
    number: 2,
    title: "Construimos tu agente",
    body: "Cargamos tus datos, conectamos tus canales y entrenamos al agente con tus respuestas reales. Tú solo nos pasas la info de tu negocio.",
  },
  {
    number: 3,
    title: "Tu agente en vivo",
    body: "Lo dejamos funcionando. Le enseñamos a tu equipo a usarlo. Si en la semana 3 nadie lo está usando, lo ajustamos sin costo hasta que lo adopten.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="section-y px-6" style={{ background: "var(--section-alt)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="tag mb-5 inline-block">Cómo funciona</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            De cero a agente en vivo{" "}
            <em className="gradient-text">en 48 horas.</em>
          </h2>
        </div>

        {/* Flow visual: desktop horizontal con flechas */}
        <div className="hidden md:flex items-start justify-center gap-0 mb-8 flex-wrap">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              className="flex items-start"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div
                className="card-hover flex flex-col items-center text-center p-6"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 2,
                  maxWidth: 280,
                  minWidth: 240,
                }}
              >
                <span className="number-badge mb-4">{step.number}</span>
                <h3
                  className="text-base font-medium mb-2 leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.75 }}
                >
                  {step.body}
                </p>
              </div>

              {i < STEPS.length - 1 && (
                <div className="flex items-center justify-center px-4 pt-10">
                  <span
                    style={{
                      color: "var(--champagne)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "1.2rem",
                      opacity: 0.5,
                    }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-hover flex gap-5 p-6"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--hairline)",
                borderRadius: 2,
              }}
            >
              <span className="number-badge mt-0.5 flex-shrink-0">{step.number}</span>
              <div className="flex-1">
                <h3
                  className="text-base font-medium mb-2 leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.75 }}
                >
                  {step.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Arrow connector for mobile: vertical arrows between cards */}
        <div className="md:hidden flex flex-col items-center gap-2 mt-2 mb-6">
          {STEPS.slice(0, -1).map((_, i) => (
            <span
              key={i}
              className="hidden"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
