"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Cómo sé si mi empresa necesita IA, o si todavía está en la «B» o en la «P» del Protocolo BPI?",
    a: "Eso es exactamente lo que resolvemos en el Test de Fit. En 30 minutos identificamos en qué letra está tu empresa: si todavía tienes problemas de bases (data, equipo, sistemas) o de procesos (flujos rotos, incentivos desalineados), te lo decimos y te recomendamos qué arreglar primero. No nos metemos a vender una «I» que sabemos que va a fracasar.",
  },
  {
    q: "¿Por qué se especializan en empresas medianas y no en grandes corporativos?",
    a: "Porque ahí está la brecha. Las consultoras serias se dedican a Fortune 500 y a corporativos enormes — las medianas quedan a merced de agencias que venden chatbots y promesas vagas. CrececonIA existe para que las medianas accedan al mismo rigor técnico y operacional que reciben las grandes, sin pagar las horas infinitas de una Big Four.",
  },
  {
    q: "Ya intentamos implementar IA antes y no vimos valor. ¿Qué hacen distinto ustedes?",
    a: "Probablemente saltaste a la «I» sin que las Bases o los Procesos estuvieran listos. La mayoría de implementaciones fallidas que vemos no son problemas técnicos — son problemas de diseño operacional. En el Test de Fit revisamos qué pasó la vez anterior y te decimos honestamente si vale la pena retomar el proyecto o si todavía no es el momento.",
  },
  {
    q: "¿Cuánto cuesta? ¿Por qué no publican planes con precio?",
    a: "El Test de Fit es gratuito. Si avanzamos, el rango va de USD 500 (auditoría profunda, 2 semanas) a USD 5.000+ (implementación completa con 90 días). No publicamos planes con precio porque no creemos en cobrar por SKU — el monto depende del alcance real de tu caso, no de un catálogo. Y nada se confirma hasta que tú apruebes el presupuesto.",
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
                  borderColor: isOpen ? "rgba(217,179,106,0.35)" : "rgba(30,30,31,0.9)",
                  background: isOpen ? "rgba(217,179,106,0.04)" : "var(--carbon)",
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

                <div
                  className="accordion-body px-6"
                  style={{ maxHeight: isOpen ? 420 : 0 }}
                >
                  <p
                    className="text-sm leading-relaxed pb-5"
                    style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
