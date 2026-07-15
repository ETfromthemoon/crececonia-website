"use client";

import { motion } from "framer-motion";

const FEATURES = [
  "Implementación completa en 48 horas",
  "Integración con WhatsApp, web, Instagram",
  "Carga de conocimiento de tu negocio",
  "Capacitación de tu equipo (1 sesión)",
  "Soporte continuo mensual",
  "Sin contrato anual — cancelas cuando quieras",
  "Setup gratis para los primeros 5 clientes",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
});

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M3 8L6.5 11.5L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section
      id="precio"
      className="section-y px-6"
      style={{ background: "var(--section-alt)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <motion.p className="tag mb-6" {...fadeUp(0)}>
          Precio
        </motion.p>

        <motion.h2
          className="font-light leading-tight mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          {...fadeUp(0.08)}
        >
          Desde{" "}
          <em className="gradient-text">USD 297/mes</em>.
        </motion.h2>

        <motion.p
          className="text-base leading-relaxed mb-12"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
          {...fadeUp(0.14)}
        >
          Setup único de USD 200. Gratis para los primeros 5 clientes.
        </motion.p>

        <motion.div
          className="text-left mb-12 px-8 py-8"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--hairline)",
            borderRadius: 2,
          }}
          {...fadeUp(0.2)}
        >
          <ul className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 items-start">
                <span
                  style={{
                    color: "var(--champagne)",
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                >
                  <CheckIcon />
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--bone)", fontWeight: 300 }}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...fadeUp(0.26)}>
          <a
            href="https://wa.me/569XXXXXXXX?text=Quiero%20ser%20de%20los%20primeros%205%20clientes%20con%20setup%20gratis"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Quiero ser de los primeros 5
          </a>
        </motion.div>
      </div>
    </section>
  );
}
