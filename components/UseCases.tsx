"use client";

import { motion } from "framer-motion";

const VERTICALS = [
  {
    title: "Restaurantes y delivery",
    description:
      "Reservas, consultas de menú, pedidos, horarios. 24/7 sin que tu equipo toque el teléfono.",
  },
  {
    title: "Clínicas y salud",
    description:
      "Agenda de horas, precios de tratamientos, confirmaciones automáticas. Menos llamadas, más pacientes.",
  },
  {
    title: "Servicios profesionales",
    description:
      "Cotizaciones, disponibilidad, seguimiento de leads. Como tener un vendedor que nunca duerme.",
  },
  {
    title: "Retail y e-commerce",
    description:
      "Tracking de pedidos, cambios, consultas de stock. Lo que tu equipo hace hoy manualmente, automatizado.",
  },
];

export default function UseCases() {
  return (
    <section id="verticales" className="section-y px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="tag mb-5 inline-block">¿Para qué tipo de negocio?</p>
          <h2
            className="font-light leading-tight max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            Tu agente IA funciona en WhatsApp, web e Instagram.{" "}
            <em className="gradient-text">Estos son los verticales donde más rinde.</em>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {VERTICALS.map((v, i) => (
            <motion.div
              key={v.title}
              className="flex flex-col gap-2 p-6"
              style={{
                borderRadius: 2,
                background: "var(--card-bg)",
                border: "1px solid var(--hairline)",
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{
                borderColor: "rgba(196,155,74,0.3)",
                boxShadow: "0 0 0 1px rgba(196,155,74,0.15), 0 12px 32px rgba(196,155,74,0.08)",
                transition: { duration: 0.25 },
              }}
            >
              <h3
                className="font-light text-lg mb-1"
                style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
              >
                {v.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.7 }}
              >
                {v.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
