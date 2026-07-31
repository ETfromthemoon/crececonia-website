"use client";

import { motion } from "framer-motion";
import { whatsappUrl } from "@/lib/contact";

const FEATURES = [
  "Implementación completa en 48 horas",
  "Integración con WhatsApp, web, Instagram",
  "Carga de conocimiento de tu negocio",
  "Capacitación de tu equipo (1 sesión)",
  "Soporte continuo mensual",
  "Sin contrato anual — cancelas cuando quieras",
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
          <em className="gradient-text">USD 297/mes</em>, todo incluido.
        </motion.h2>

        {/* El cargo de configuración se dice completo y en el mismo lugar que
            la mensualidad. Antes el hero prometía "desde USD 297" y el cargo
            de USD 200 aparecía recién acá: un costo sorpresa a mitad de
            página es una de las causas más limpias de abandono. */}
        <motion.p
          className="text-base leading-relaxed mb-12"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
          {...fadeUp(0.14)}
        >
          Más USD 200 de configuración inicial, una sola vez. Sin costos
          escondidos y sin contrato anual.
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

        {/* Garantía: venía de Services.tsx, que era esta misma sección
            escrita dos veces (mismos features, otro formato, pegada justo
            después). Al fusionar, este bloque es lo único que Services
            aportaba de nuevo. */}
        <motion.div
          className="text-left mb-12 px-6 py-5"
          style={{
            background: "var(--gold-soft)",
            border: "1px solid rgba(196,155,74,0.28)",
            borderRadius: 2,
          }}
          {...fadeUp(0.24)}
        >
          <p
            className="text-xs mb-2"
            style={{
              color: "var(--champagne)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Garantía
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Si en la semana 3 tu equipo no está usando el agente, lo ajustamos
            sin costo hasta que lo usen. Que funcione es nuestro problema, no el
            tuyo.
          </p>
        </motion.div>

        <motion.div {...fadeUp(0.3)}>
          <a
            href={whatsappUrl("Hola! Quiero un agente IA para mi negocio")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Quiero mi agente IA
          </a>
        </motion.div>
      </div>
    </section>
  );
}
