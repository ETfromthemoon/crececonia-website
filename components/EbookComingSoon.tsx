"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEvaluacion } from "./EvaluacionProvider";
import { EBOOK_ACCENT as ACCENT, EBOOK_COLD_BG as BG } from "@/lib/ebook-theme";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

const blurIn = (delay = 0) => ({
  initial: { opacity: 0, y: 32, filter: "blur(14px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.9, delay, ease: EASE },
});

type Props = {
  title: string;
  description: string;
  ghostWord: string;
  ctaSource: string;
};

/**
 * Plantilla de "próximamente" para un ebook aún no lanzado. Reusa el mismo
 * cold-open oscuro + tipografía editorial de EbookHero (mismo BG/ACCENT vía
 * lib/ebook-theme) para que se sienta parte de la misma familia de páginas,
 * pero sin precio ni checkout — solo captura de interés vía EvaluacionModal.
 */
export default function EbookComingSoon({ title, description, ghostWord, ctaSource }: Props) {
  const { abrir } = useEvaluacion();

  return (
    <section
      className="flex items-center section-y-spacious px-6"
      style={{ minHeight: "88vh", background: BG, position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
          zIndex: 0,
        }}
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "var(--font-serif-monad), Georgia, serif",
          fontSize: "clamp(6rem, 22vw, 16rem)",
          color: "rgba(246,243,241,0.05)",
          lineHeight: 1,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 0,
        }}
      >
        {ghostWord}
      </motion.div>

      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <motion.p
          {...fadeUp(0.04)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.68rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: ACCENT,
            marginBottom: 20,
          }}
        >
          Próximamente · Ebook · CrececonIA
        </motion.p>

        <motion.h1
          {...blurIn(0.1)}
          style={{
            fontFamily: "var(--font-serif-monad), Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "#f6f3f1",
            marginBottom: 24,
            textShadow: "0 4px 40px rgba(0,0,0,0.4)",
          }}
        >
          {title}
        </motion.h1>

        <motion.p
          {...fadeUp(0.18)}
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.75,
            color: "rgba(246,243,241,0.68)",
            marginBottom: 36,
            fontWeight: 400,
          }}
        >
          {description}
        </motion.p>

        <motion.div
          {...fadeUp(0.26)}
          style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}
        >
          <button
            type="button"
            onClick={() => abrir(ctaSource)}
            className="btn-monad-fill"
            style={{
              cursor: "pointer",
              background: "#f6f3f1",
              color: "#141414",
              borderColor: "#f6f3f1",
              boxShadow: "0 0 40px rgba(246,243,241,0.15)",
            }}
          >
            Avísame cuando esté disponible
          </button>

          <Link
            href="/ebooks"
            style={{
              color: "rgba(246,243,241,0.5)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
              textDecoration: "underline",
              textDecorationColor: "rgba(246,243,241,0.25)",
            }}
          >
            ← Ver todos los ebooks
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
