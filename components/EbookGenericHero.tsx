"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import EbookSoldCounter from "./EbookSoldCounter";
import type { PriceInfo } from "@/lib/ebook-pricing";
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
  resource: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  coverSrc: string;
  coverAlt: string;
};

/**
 * Hero genérico y parametrizable para los libros que no tienen la sección
 * cinemática a medida del libro 1 (mockup 3D, ghost wordmark, immersion).
 * Comparte tokens de color/tipografía/motion con EbookHero para que no se
 * sienta un componente ajeno, pero es deliberadamente más simple — se puede
 * llevar al mismo nivel de producción que el libro 1 más adelante.
 */
export default function EbookGenericHero({
  resource,
  eyebrow,
  title,
  titleAccent,
  description,
  coverSrc,
  coverAlt,
}: Props) {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

  useEffect(() => {
    fetch(`/api/ebook/cupos?resource=${resource}`)
      .then((r) => r.json())
      .then(setPriceInfo)
      .catch(() => {});
  }, [resource]);

  const price = priceInfo?.price ?? null;
  const formattedPrice = price ? price.toLocaleString("es-CL") : null;

  function scrollToComprar() {
    document.getElementById("comprar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className="flex items-center section-y-spacious px-6"
      style={{ minHeight: "80vh", background: BG, position: "relative", overflow: "hidden" }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <motion.p
              {...fadeUp(0.04)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(246,243,241,0.6)",
                marginBottom: 20,
              }}
            >
              {eyebrow}
            </motion.p>

            <motion.div {...fadeUp(0.02)} style={{ marginBottom: 4 }}>
              <Link
                href="/ebooks"
                style={{
                  color: "rgba(246,243,241,0.55)",
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(246,243,241,0.3)",
                }}
              >
                Ver todos los ebooks →
              </Link>
            </motion.div>

            <motion.h1
              {...blurIn(0.1)}
              style={{
                fontFamily: "var(--font-serif-monad), Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(2.4rem, 5.4vw, 4rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#f6f3f1",
                marginBottom: 24,
                textShadow: "0 4px 40px rgba(0,0,0,0.4)",
              }}
            >
              {title} <em style={{ fontStyle: "italic", color: ACCENT }}>{titleAccent}</em>
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              style={{
                fontSize: "1.02rem",
                lineHeight: 1.75,
                color: "rgba(246,243,241,0.68)",
                marginBottom: 36,
                maxWidth: 480,
                fontWeight: 400,
              }}
            >
              {description}
            </motion.p>

            <motion.div
              {...fadeUp(0.26)}
              style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}
            >
              <button
                onClick={scrollToComprar}
                className="btn-monad-fill"
                style={{
                  cursor: "pointer",
                  background: "#f6f3f1",
                  color: "#141414",
                  borderColor: "#f6f3f1",
                  boxShadow: "0 0 40px rgba(246,243,241,0.15)",
                }}
              >
                {formattedPrice ? `Comprar · $${formattedPrice} CLP` : "Comprar ahora"}
              </button>

              {priceInfo?.tier === "super-early" && (
                <p style={{ color: ACCENT, fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                  Super Early
                </p>
              )}
              {priceInfo?.tier === "early" && (
                <p style={{ color: ACCENT, fontFamily: "var(--font-mono)", fontSize: "0.72rem", letterSpacing: "0.08em" }}>
                  Early Adopters
                </p>
              )}
              <EbookSoldCounter />
            </motion.div>

            <motion.p
              {...fadeUp(0.34)}
              style={{
                color: "rgba(246,243,241,0.5)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
                marginTop: 24,
              }}
            >
              PDF · Incluye versión de escritorio + versión para celular · Descarga inmediata
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: EASE }}
            style={{
              position: "relative",
              margin: "0 auto",
              maxWidth: 340,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src={coverSrc}
              alt={coverAlt}
              width={1284}
              height={2052}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
