"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿En qué formato viene el ebook?",
    a: "En PDF, optimizado para leer en desktop y en mobile. Una vez que comprás, podés descargarlo inmediatamente y guardarlo donde quieras. No hay DRM ni restricciones de copia.",
  },
  {
    q: "¿Cómo recibo el ebook después de comprar?",
    a: "Inmediatamente después del pago vas a ver un botón de descarga. También te enviamos un email con el link para que lo tengas de respaldo. Si perdés el email, podés recuperar la descarga en la página de re-descarga ingresando tu email.",
  },
  {
    q: "¿Tiene garantía o devolución?",
    a: "Si terminás el ebook y sentís que no valió la pena, escribime directamente y te devuelvo lo que pagaste. Sin preguntas raras. No quiero que nadie se quede con algo que no le sirvió.",
  },
  {
    q: "¿Necesito saber programar para aprovechar el ebook?",
    a: "No. Empezamos desde cero: qué es Claude, cómo instalarlo, cómo funciona. Si ya sabés programar, vas a avanzar más rápido y sacarle más jugo a los workflows de código. Pero el punto de partida es para cualquiera.",
  },
  {
    q: "¿Claude es gratis? ¿Necesito pagar algo más?",
    a: "Claude tiene un tier gratuito que funciona bien para empezar. El ebook cubre ambos escenarios: cómo sacarle el máximo al plan gratuito y cuándo tiene sentido pasarse al Pro. No tenés que gastar nada más para aplicar lo del ebook.",
  },
  {
    q: "¿Esto es un curso en video o hay soporte incluido?",
    a: "Es un ebook en PDF. Nada de videos ni plataformas — solo texto, prompts y templates que podés copiar. No incluye soporte 1:1. Si querés acompañamiento personalizado, ese es el servicio de consultoría de CrececonIA.",
  },
];

export default function EbookFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="section-y-narrow px-6">
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
                    ? "rgba(217,179,106,0.35)"
                    : "rgba(30,30,31,0.9)",
                  background: isOpen
                    ? "rgba(217,179,106,0.04)"
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
                      style={{
                        color: "var(--ash)",
                        fontWeight: 300,
                        lineHeight: 1.8,
                      }}
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
