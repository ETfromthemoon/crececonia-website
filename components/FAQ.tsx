"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "¿Mi empresa necesita tener experiencia previa con IA?",
    a: "No. La mayoría de nuestros clientes parte desde cero. Lo que necesitas es tener al menos un proceso que hoy consume demasiado tiempo y la voluntad del equipo de adoptar algo nuevo. Nosotros ponemos el resto.",
  },
  {
    q: "¿Cuánto tiempo pasa hasta ver impacto real?",
    a: "En la mayoría de los casos el sistema empieza a usarse en las primeras 2–3 semanas de implementación. El ROI completo normalmente es visible al mes de uso sostenido.",
  },
  {
    q: "¿Qué herramientas usan?",
    a: "Depende del proceso y de lo que ya tengas. Trabajamos con ChatGPT Enterprise, Claude, Make, n8n, Zapier, Google Workspace, HubSpot, Notion y ERPs. No estamos atados a ninguna plataforma: elegimos lo que mejor encaja en tu operación.",
  },
  {
    q: "¿Trabajan con empresas fuera de Chile?",
    a: "Sí. Trabajamos 100% remoto y asíncrono. Tenemos clientes activos en México, Colombia, Argentina, Perú y España.",
  },
  {
    q: "¿Qué pasa si en el diagnóstico me dicen que no hay fit?",
    a: "Te lo decimos directo en la misma llamada. Si no hay un caso claro para IA en tu empresa ahora, no tiene sentido seguir. Te damos una recomendación honesta de qué hacer primero y quizás hablamos de nuevo en 6 meses.",
  },
  {
    q: "¿Cómo funciona el diagnóstico gratuito?",
    a: "Es una videollamada de 30 minutos. Revisamos juntos los procesos que más tiempo consumen, identificamos si hay oportunidad real y te decimos sin rodeos si podemos ayudarte o no. Sin pitch de venta.",
  },
  {
    q: "¿Cuánto cuesta implementar IA con ustedes?",
    a: "Una auditoría parte desde USD 1.500 (2 semanas). Una implementación end-to-end de un proceso, desde USD 6.000. El monto exacto lo definimos después del diagnóstico, dependiendo del proceso, integraciones y volumen de datos. Nada se confirma antes de que tú apruebes el presupuesto.",
  },
  {
    q: "¿Qué pasa si después de implementar no veo el ROI esperado?",
    a: "Si en la semana 3 la adopción es menor al 30%, iteramos sin costo. Si el cambio es por una decisión de negocio que cambió (no por el sistema), te ayudamos a redireccionar el activo hacia otro proceso.",
  },
  {
    q: "¿Por qué ustedes y no una agencia o un consultor genérico?",
    a: "Una agencia te vende horas de implementación. Un consultor genérico te entrega un PDF. Nosotros instalamos el sistema y nos quedamos hasta que tu equipo lo use. Si en la semana 3 no se usa, no facturamos la fase de adopción.",
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
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", color: "var(--bone)" }}
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
                  <span className="font-light text-sm leading-snug" style={{ color: "var(--bone)" }}>
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 text-xl leading-none transition-transform duration-300"
                    style={{
                      color: isOpen ? "var(--champagne)" : "var(--smoke)",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  className="accordion-body px-6"
                  style={{ maxHeight: isOpen ? 300 : 0 }}
                >
                  <p className="text-sm leading-relaxed pb-5" style={{ color: "var(--ash)", fontWeight: 300 }}>
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
