"use client";

import { motion } from "framer-motion";
import { whatsappUrl } from "@/lib/contact";

const PAIN_POINTS = [
  {
    number: 1,
    title: "Pierdes leads por no responder a tiempo",
    body: "Un cliente te escribe a las 9 PM. Nadie responde hasta el día siguiente. Para entonces ya le compró a otro.",
  },
  {
    number: 2,
    title: "Tu equipo gasta horas en preguntas repetitivas",
    body: "Precios, horarios, dirección, requisitos. Las mismas 10 preguntas, todos los días. Eso es lo que un agente debería resolver.",
  },
  {
    number: 3,
    title: "No tienes visibilidad de lo que preguntan tus clientes",
    body: "Sin un agente, cada conversación se pierde en el WhatsApp de un empleado. Un agente te deja ver todo.",
  },
] as const;

const WHATSAPP_URL = whatsappUrl("Quiero resolver la saturación de mi equipo");

export default function PainPoints() {
  return (
    <section id="dolores" className="section-y px-6">
      <div className="max-w-4xl mx-auto">
        <p className="tag mb-5 inline-block">¿Esto te suena?</p>
        <h2
          className="font-light mb-12 leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
        >
          Tu equipo está saturado respondiendo{" "}
          <em className="gradient-text">lo mismo una y otra vez.</em>
        </h2>

        <div className="flex flex-col gap-5 mb-12">
          {PAIN_POINTS.map((point) => (
            <motion.div
              key={point.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: (point.number - 1) * 0.12 }}
              className="card-hover flex gap-5 p-6"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--hairline)",
                borderRadius: 2,
              }}
            >
              <span className="number-badge mt-0.5">{point.number}</span>
              <div className="flex-1">
                <h3
                  className="text-base font-medium mb-2 leading-snug"
                  style={{ color: "var(--ink)" }}
                >
                  {point.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.75 }}
                >
                  {point.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Quiero mi agente IA
          </a>
        </div>
      </div>
    </section>
  );
}
