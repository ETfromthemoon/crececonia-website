"use client";

import { WAButton } from "./GradientButton";

export default function FinalCTA() {
  return (
    <section
      id="contacto-wa"
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "var(--obsidian)" }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      {/* Orbe champagne — superior izquierdo */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-5%", left: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(217,179,106,0.12), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      {/* Orbe champagne dim — centro superior */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0%", left: "50%",
          transform: "translateX(-50%)",
          width: 600, height: 400,
          background: "radial-gradient(ellipse, rgba(140,111,63,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      {/* Orbe verde — inferior derecha */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-5%", right: "-5%",
          width: 420, height: 420,
          background: "radial-gradient(circle, rgba(37,211,102,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <h2
          className="font-light mb-4 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
            color: "var(--bone)",
            letterSpacing: "-0.02em",
          }}
        >
          Dinos{" "}
          <em className="gradient-text">qué proceso te quita el sueño.</em>
        </h2>
        <p
          className="text-base mb-3 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Respondemos en menos de 2 horas hábiles. Si no vemos fit real, te lo decimos
          y te recomendamos qué hacer.
        </p>
        <p
          className="text-xs mb-10"
          style={{
            color: "var(--champagne)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Cupos disponibles para junio 2026 · Agenda hoy
        </p>

        <div className="flex justify-center">
          <WAButton source="final-primary" size="lg">
            Quiero mi diagnóstico gratis
          </WAButton>
        </div>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs"
          style={{
            color: "var(--smoke)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          <span>30 min · sin compromiso</span>
          <span className="hidden sm:block">·</span>
          <span>Confidencial con NDA incluido</span>
          <span className="hidden sm:block">·</span>
          <span>Si no hay fit, te recomendamos qué hacer</span>
        </div>
      </div>
    </section>
  );
}
