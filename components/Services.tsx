"use client";

import { whatsappUrl } from "@/lib/contact";

const WHATSAPP_URL = whatsappUrl("Quiero mi agente IA");

const INCLUDES = [
  {
    title: "Implementación completa",
    description:
      "Tu agente configurado, conectado a tus canales y funcionando en 48 horas. Sin instalar nada.",
  },
  {
    title: "Conocimiento de tu negocio",
    description:
      "Cargamos tus menús, servicios, precios, políticas y preguntas frecuentes. Tu agente sabe lo que sabe tu equipo.",
  },
  {
    title: "Soporte y evolución",
    description:
      "Acompañamiento continuo. Si algo cambia en tu negocio, actualizamos el agente. Si no lo usan, lo ajustamos sin costo.",
  },
];

export default function Investment() {
  return (
    <section id="servicios" className="section-y px-6" style={{ background: "var(--section-alt)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="tag mb-5 inline-block">Qué incluye</p>
          <h2
            className="font-light leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink)" }}
          >
            Todo lo que necesitas.{" "}
            <em className="gradient-text">Una tarifa. Todo incluido.</em>
          </h2>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Tu agente IA llega listo para trabajar. No necesitas integrar APIs,
            contratar desarrolladores ni entender de prompts. Nosotros nos
            encargamos de todo.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          {INCLUDES.map((item) => (
            <div
              key={item.title}
              className="flex gap-5 px-6 py-5"
              style={{
                borderRadius: 2,
                border: "1px solid var(--hairline)",
                background: "var(--card-bg)",
              }}
            >
              <span
                className="flex-shrink-0"
                style={{
                  color: "var(--champagne)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginTop: 4,
                  minWidth: 16,
                }}
              >
                ✓
              </span>
              <div>
                <p
                  className="font-light text-base mb-1.5"
                  style={{ color: "var(--ink)" }}
                >
                  {item.title}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.7 }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="px-6 py-5 mb-10"
          style={{
            background: "var(--gold-soft)",
            border: "1px solid rgba(196,155,74,0.28)",
            borderRadius: 2,
          }}
        >
          <p
            className="text-xs mb-2"
            style={{
              color: "var(--champagne)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
              Garantía
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: "var(--muted)", fontWeight: 300, lineHeight: 1.8 }}
          >
            Si en la semana 3 tu equipo no está usando el agente, lo ajustamos sin
            costo hasta que lo usen. Que funcione es nuestro problema, no el
            tuyo.
          </p>
        </div>

        <div className="flex justify-start">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Quiero mi agente IA →
          </a>
        </div>
      </div>
    </section>
  );
}
