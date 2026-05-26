"use client";

import { motion } from "framer-motion";
import { WAButton } from "./GradientButton";
import { BackgroundPaths } from "./ui/background-paths";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});

export default function Hero() {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden px-6"
      style={{ minHeight: "100svh", paddingTop: 80, paddingBottom: 96 }}
    >
      {/* Capas de fondo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <BackgroundPaths />
        <div className="absolute inset-0 dot-pattern opacity-60" />
        <div
          className="orb-animate absolute rounded-full"
          style={{
            top: "28%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 960,
            height: 720,
            background:
              "radial-gradient(ellipse, rgba(217,179,106,0.1) 0%, rgba(140,111,63,0.06) 40%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "5%",
            right: "8%",
            width: 420,
            height: 420,
            background: "radial-gradient(circle, rgba(217,179,106,0.08), transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: "18%",
            left: "6%",
            width: 320,
            height: 320,
            background: "radial-gradient(circle, rgba(37,211,102,0.06), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: "10%",
            right: "12%",
            width: 280,
            height: 280,
            background: "radial-gradient(circle, rgba(217,179,106,0.06), transparent 70%)",
            filter: "blur(55px)",
          }}
        />
      </div>

      {/* Contenido central */}
      <div className="relative max-w-3xl mx-auto text-center">
        {/* Etiqueta superior — manifiesto */}
        <motion.p {...fadeUp(0.04)} className="eyebrow" style={{ marginBottom: 24 }}>
          Consultoría de IA para empresas medianas
        </motion.p>

        {/* Headline manifesto */}
        <motion.h1
          {...fadeUp(0.08)}
          className="leading-none mb-5"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
            fontWeight: 300,
            color: "var(--bone)",
            letterSpacing: "-0.025em",
          }}
        >
          La mayoría no necesita IA.
          <br />
          <em className="gradient-text" style={{ fontStyle: "italic" }}>
            Necesita arreglar lo de antes.
          </em>
        </motion.h1>

        {/* Subtítulo — BPI thesis */}
        <motion.p
          {...fadeUp(0.16)}
          className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7 }}
        >
          Aplicamos el <strong style={{ color: "var(--bone)", fontWeight: 400 }}>Protocolo BPI</strong>:
          Bases, Procesos, IA — en ese orden. Si tu empresa todavía está en la &laquo;B&raquo;
          o en la &laquo;P&raquo;, te lo decimos antes de cobrarte un peso por la &laquo;I&raquo;.
        </motion.p>

        {/* CTA */}
        <motion.div {...fadeUp(0.24)} className="flex justify-center">
          <WAButton source="hero-primary" size="lg">
            Solicitar Test de Fit
          </WAButton>
        </motion.div>

        {/* Señales — una línea sobria */}
        <motion.p
          {...fadeUp(0.34)}
          className="mt-8 text-xs"
          style={{
            color: "var(--smoke)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          30 min · conversación honesta · sin pitch de venta
        </motion.p>
      </div>
    </section>
  );
}
