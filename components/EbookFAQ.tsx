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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4e4d4d",
              marginBottom: 16,
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#000",
            }}
          >
            Las que más{" "}
            <em style={{ fontStyle: "italic" }}>nos preguntan.</em>
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {FAQS.map((faq, idx) => {
            const isOpen = open === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden"
                style={{
                  borderBottom: "1px solid rgba(0,0,0,0.1)",
                  borderTop: idx === 0 ? "1px solid rgba(0,0,0,0.1)" : "none",
                }}
              >
                <button
                  className="w-full text-left py-5 flex items-center justify-between gap-4"
                  style={{ padding: "20px 0" }}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-serif-monad), Georgia, serif",
                      fontWeight: 400,
                      fontSize: "1rem",
                      lineHeight: 1.45,
                      color: "#000",
                    }}
                  >
                    {faq.q}
                  </span>
                  <span
                    style={{
                      color: "#4e4d4d",
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: "transform 0.3s ease",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      display: "block",
                    }}
                  >
                    +
                  </span>
                </button>

                <div className={`accordion-body${isOpen ? " open" : ""}`}>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.82rem",
                        lineHeight: 1.8,
                        color: "#4e4d4d",
                        paddingBottom: 20,
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
