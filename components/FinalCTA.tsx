"use client";

import { WAButton } from "./GradientButton";

export default function FinalCTA() {
  return (
    <section
      id="conversemos"
      className="section-y-spacious px-6 relative overflow-hidden"
      style={{ background: "var(--obsidian)" }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      {/* Orbe champagne — superior izquierdo */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-5%",
          left: "-5%",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(217,179,106,0.12), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: "radial-gradient(ellipse, rgba(140,111,63,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-5%",
          right: "-5%",
          width: 420,
          height: 420,
          background: "radial-gradient(circle, rgba(37,211,102,0.08), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-2xl mx-auto text-center">
        <h2
          className="font-light mb-5 leading-tight"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            color: "var(--bone)",
            letterSpacing: "-0.02em",
          }}
        >
          <em className="gradient-text">Conversemos.</em>
        </h2>
        <p
          className="text-base mb-3 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Si llegaste hasta acá y algo resonó, agenda 30 minutos para hacer
          el Test de Fit. Si no, también respondo emails directamente.
        </p>
        <p
          className="text-base mb-10 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Cualquiera de los dos te va a dar una respuesta honesta sobre si
          podemos ayudarte o si todavía no es el momento.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <WAButton source="final-primary" size="lg">
            Solicitar Test de Fit
          </WAButton>
          <a
            href="mailto:sergio@crececonia.cl"
            className="text-sm transition-opacity hover:opacity-70"
            style={{
              color: "var(--ash)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
              textDecoration: "underline",
            }}
          >
            sergio@crececonia.cl
          </a>
        </div>

        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs"
          style={{
            color: "var(--smoke)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
          }}
        >
          <span>30 min · sin pitch</span>
          <span className="hidden sm:block">·</span>
          <span>Confidencial con NDA incluido</span>
          <span className="hidden sm:block">·</span>
          <span>Te decimos en qué letra del BPI estás</span>
        </div>
      </div>
    </section>
  );
}
