"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Qué puede hacer un agente IA por mi negocio?",
    a: "Responder consultas por WhatsApp, web o Instagram 24/7. Agendar citas, dar precios, calificar leads, hacer seguimiento. Todo lo que hoy hace tu equipo de forma repetitiva, el agente lo resuelve automático. Y cuando algo necesita intervención humana, deriva la conversación a la persona correcta.",
  },
  {
    q: "¿Cuánto demora tener mi agente funcionando?",
    a: "48 horas desde que tenemos la información de tu negocio. Hacemos una videollamada de 30 minutos para entender tus procesos, cargamos el conocimiento, conectamos los canales y te entregamos el agente funcionando. En la primera semana ya está atendiendo consultas reales.",
  },
  {
    q: "¿Necesito un equipo técnico o saber de IA?",
    a: "No. Tú nos dices cómo funciona tu negocio y nosotros hacemos todo lo técnico. No necesitas instalar nada, no necesitas ingenieros, no necesitas saber de prompts ni de APIs. Solo necesitas tener claro qué hace tu negocio y qué preguntas reciben todos los días.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. No hay contrato anual ni permanencia forzada. Pagas mes a mes. Si en cualquier momento sientes que el agente no te está sirviendo, cancelas y listo. Los datos de tu negocio y tus conversaciones son tuyos.",
  },
  {
    q: "¿Qué pasa si mi negocio es muy chico o muy específico?",
    a: "Los agentes funcionan mejor cuando tienes procesos repetitivos claros: consultas que se repiten, reservas, cotizaciones, seguimiento. Si tu negocio tiene al menos 10-15 consultas diarias del mismo tipo, probablemente un agente te sirva. Si no, te lo decimos en la primera llamada, sin costo.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="section-y-narrow px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="tag mb-5 inline-block">FAQ</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Las que más{" "}
            <em className="gradient-text">nos preguntan.</em>
          </h2>
        </div>

        <div className="flex flex-col gap-2">
          {FAQS.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className="border overflow-hidden transition-all duration-200"
                style={{
                  borderRadius: 2,
                  borderColor: isOpen
                    ? "rgba(196,155,74,0.35)"
                    : "var(--hairline)",
                  background: isOpen
                    ? "rgba(196,155,74,0.04)"
                    : "var(--carbon)",
                }}
              >
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span
                    className="text-sm font-light leading-snug"
                    style={{ color: "var(--bone)" }}
                  >
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 text-xl leading-none transition-transform duration-300"
                    style={{
                      color: "var(--smoke)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </button>

                <div className={`accordion-body${isOpen ? " open" : ""}`}>
                  <div className="px-6">
                    <p
                      className="text-sm leading-relaxed pb-5"
                      style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
