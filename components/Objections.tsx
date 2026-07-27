"use client";

import { motion } from "framer-motion";

const OBJECTIONS = [
  {
    text: "Buscas un chatbot genérico",
    description:
      "Entrenamos al agente con lo que sabe tu negocio. Tus menús, tus precios, tus políticas. No es un robot con respuestas prefabricadas.",
  },
  {
    text: "Tu negocio todavía no tiene procesos claros",
    description:
      "Si hoy no sabes cómo atienden a tus clientes, el agente no va a tener de dónde aprender. Primero ordenamos eso juntos.",
  },
  {
    text: "Crees que un agente IA reemplaza a tu equipo",
    description:
      "El agente responde lo repetitivo. Cuando un cliente necesita hablar con una persona, el agente deriva la conversación. No desaparece a nadie.",
  },
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

function XMarkIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <line
        x1="7"
        y1="7"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="7"
        x2="7"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Objections() {
  return (
    <section
      className="section-y px-6"
      style={{ background: "var(--section-alt)" }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          className="font-light mb-14 leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          {...fadeUp(0)}
        >
          Esto <em className="gradient-text">NO</em> es para ti si:
        </motion.h2>

        <div className="flex flex-col gap-10">
          {OBJECTIONS.map((item, i) => (
            <motion.div key={item.text} className="flex gap-5" {...fadeUp(0.12 + i * 0.1)}>
              <span
                style={{ color: "var(--champagne)", flexShrink: 0, marginTop: 1 }}
              >
                <XMarkIcon />
              </span>
              <div>
                <p
                  className="font-light text-lg leading-snug mb-2"
                  style={{ color: "var(--bone)" }}
                >
                  {item.text}
                </p>
                <p
                  className="text-sm leading-relaxed max-w-lg"
                  style={{
                    color: "var(--ash)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
