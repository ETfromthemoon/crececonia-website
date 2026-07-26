"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import EbookPreview from "./EbookPreview";
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

export default function EbookHero() {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);

  useEffect(() => {
    fetch("/api/ebook/cupos")
      .then((r) => r.json())
      .then(setPriceInfo)
      .catch(() => {});
  }, []);

  const price = priceInfo?.price ?? null;
  const formattedPrice = price ? price.toLocaleString("es-CL") : null;

  function scrollToComprar() {
    document.getElementById("comprar")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className="flex items-center section-y-spacious px-6"
      style={{ minHeight: "88vh", background: BG, position: "relative", overflow: "hidden" }}
    >
      {/* Cinematic cold-open: vignette + grain, ties into EbookImmersion right after */}
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
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "3px 3px",
          opacity: 0.025,
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-center">
          {/* Left: copy + CTA */}
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
              Ebook · CrececonIA
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
                fontSize: "clamp(2.6rem, 6vw, 4.6rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.01em",
                color: "#f6f3f1",
                marginBottom: 24,
                textShadow: "0 4px 40px rgba(0,0,0,0.4)",
              }}
            >
              De cero a Claude{" "}
              <em style={{ fontStyle: "italic", color: ACCENT }}>en una semana.</em>
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.75,
                color: "rgba(246,243,241,0.68)",
                marginBottom: 36,
                maxWidth: 440,
                fontWeight: 400,
              }}
            >
              La guía práctica para dominar Claude Code sin perder semanas
              probando. Desde la instalación hasta prompts que generan código
              en producción — todo en 150+ páginas.
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
                {formattedPrice
                  ? `Comprar · $${formattedPrice} CLP`
                  : "Comprar ahora"}
              </button>

              {priceInfo?.tier === "super-early" && (
                <p
                  style={{
                    color: ACCENT,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  Super Early — 60% off
                </p>
              )}
              {priceInfo?.tier === "early" && (
                <p
                  style={{
                    color: ACCENT,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  Early Adopters — 33% off
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
              PDF · Descarga inmediata · Garantía de devolución
            </motion.p>
          </div>

          {/* Right: 3D Mockup with editorial overlap (ghost wordmark behind) */}
          <div className="relative flex items-center justify-center">
            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
              style={{
                position: "absolute",
                fontFamily: "var(--font-serif-monad), Georgia, serif",
                fontSize: "clamp(6rem, 18vw, 13rem)",
                color: "rgba(246,243,241,0.06)",
                lineHeight: 1,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                userSelect: "none",
                zIndex: 0,
              }}
            >
              Claude
            </motion.div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <EbookPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
