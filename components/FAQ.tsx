"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Cuánto tiempo pasa hasta ver impacto real?",
    a: "En la mayoría de los casos el sistema empieza a usarse en las primeras 2–3 semanas de implementación. El ROI completo normalmente es visible al mes de uso sostenido.",
  },
  {
    q: "¿Cuánto cuesta trabajar con ustedes?",
    a: "El diagnóstico de 30 minutos es gratis, siempre. Si quieres ir más profundo, una Auditoría Express cuesta USD 500 (2 semanas, mapa + ROI). Una implementación end-to-end parte desde USD 1.500 según el proceso e integraciones. El monto exacto lo definimos después del diagnóstico — nada se confirma antes de que tú apruebes el presupuesto.",
  },
  {
    q: "¿Qué pasa si en el diagnóstico me dicen que no hay fit?",
    a: "Te lo decimos directo en la misma llamada. Si no hay un caso claro para IA en tu empresa ahora, no tiene sentido seguir. Te damos una recomendación honesta de qué hacer primero y quizás hablamos de nuevo en 6 meses.",
  },
  {
    q: "¿Qué pasa si después de implementar no veo el ROI esperado?",
    a: "Si en la semana 3 la adopción es menor al 30%, iteramos sin costo. Si el cambio es por una decisión de negocio que cambió (no por el sistema), te ayudamos a redireccionar el activo hacia otro proceso.",
  },
  {
    q: "¿Necesito tener mis datos ordenados para empezar?",
    a: "No para la fase 1. Para la implementación, parte del trabajo es estructurar lo mínimo necesario. No esperes tener un data warehouse perfecto: en el 80% de los casos trabajamos directamente sobre lo que ya tienes.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 px-6" style={{ background: "var(--graphite)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="tag mb-5 inline-block">FAQ</p>
          <h2
            className="font-light leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              color: "var(--bone)",
            }}
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
                  style={{ maxHeight: isOpen ? 320 : 0 }}
                >
                  <p
                    className="text-sm leading-relaxed pb-5"
                    style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
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
