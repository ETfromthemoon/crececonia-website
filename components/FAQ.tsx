"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Qué puede hacer un agente IA por mi negocio?",
    a: "Atender consultas por WhatsApp, web o Instagram. 24/7. Agendar citas, dar precios, calificar leads. Cuando algo necesita a una persona, deriva la conversación. Sin que tu equipo toque el teléfono.",
  },
  {
    q: "¿Cuánto demora tener mi agente funcionando?",
    a: "48 horas desde que nos pasas la info de tu negocio. Hacemos una videollamada de 30 minutos, configuramos todo, y en la primera semana ya está atendiendo clientes reales.",
  },
  {
    q: "¿Necesito un equipo técnico o saber de IA?",
    a: "No. Tú conoces tu negocio, nosotros hacemos lo demás. No instalas nada, no necesitas ingenieros, no tocas una API. Solo nos dices cómo operas y qué preguntas recibes todos los días.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Es mes a mes. Si en cualquier momento sientes que no te está sirviendo, cancelas. Tus datos y tus conversaciones son tuyos.",
  },
  {
    q: "¿Qué pasa si mi negocio es muy chico o muy específico?",
    a: "Si tienes al menos 10-15 consultas diarias que se repiten, probablemente un agente te sirva. Si no, te lo decimos en la primera llamada sin cobrarte.",
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
