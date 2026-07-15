"use client";

export default function FinalCTA() {
  return (
    <section
      id="conversemos"
      className="section-y-spacious px-6 relative overflow-hidden"
      style={{ background: "var(--section-alt)" }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

      {/* Orbes champagne — tema claro, opacidad baja */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-5%",
          left: "-5%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(196,155,74,0.10), transparent 70%)",
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
          background:
            "radial-gradient(ellipse, rgba(140,111,63,0.06), transparent 70%)",
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
          background:
            "radial-gradient(circle, rgba(196,155,74,0.06), transparent 70%)",
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
          ¿Listo para dejar de{" "}
          <em className="gradient-text">responder lo mismo</em> todos los días?
        </h2>

        <p
          className="text-base mb-10 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Cuéntanos de tu negocio. En 30 minutos te decimos si un agente IA te
          sirve o no. Sin costo, sin compromiso.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="https://wa.me/569XXXXXXXX"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: "16px 32px", fontSize: "0.95rem" }}
          >
            Quiero mi agente IA
          </a>
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
          <span>48h de setup</span>
          <span className="hidden sm:block">&middot;</span>
          <span>USD 297/mes</span>
          <span className="hidden sm:block">&middot;</span>
          <span>sin permanencia</span>
        </div>
      </div>
    </section>
  );
}
