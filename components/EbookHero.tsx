"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EbookPreview from "./EbookPreview";
import type { PriceInfo } from "@/lib/ebook-pricing";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
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
      style={{ minHeight: "88vh" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
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
                color: "#4e4d4d",
                marginBottom: 20,
              }}
            >
              Ebook · CrececonIA
            </motion.p>

            <motion.h1
              {...fadeUp(0.1)}
              style={{
                fontFamily: "var(--font-serif-monad), Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                color: "#000",
                marginBottom: 24,
              }}
            >
              De cero a Claude{" "}
              <em style={{ fontStyle: "italic" }}>en una semana.</em>
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              style={{
                fontSize: "1.05rem",
                lineHeight: 1.75,
                color: "#4e4d4d",
                marginBottom: 36,
                maxWidth: 440,
                fontWeight: 400,
              }}
            >
              La guía práctica para dominar Claude Code sin perder semanas
              probando. Desde la instalación hasta prompts que generan código
              en producción — todo en 120 páginas.
            </motion.p>

            <motion.div
              {...fadeUp(0.26)}
              style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}
            >
              <button
                onClick={scrollToComprar}
                className="btn-monad-fill"
                style={{ cursor: "pointer" }}
              >
                {formattedPrice
                  ? `Comprar · $${formattedPrice} CLP`
                  : "Comprar ahora"}
              </button>

              {priceInfo?.tier === "super-early" && (
                <p
                  style={{
                    color: "#4e4d4d",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  Super Early — 60% off · {priceInfo.remaining} cupo
                  {priceInfo.remaining === 1 ? "" : "s"} restante
                  {priceInfo.remaining === 1 ? "" : "s"}
                </p>
              )}
              {priceInfo?.tier === "early" && (
                <p
                  style={{
                    color: "#4e4d4d",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  Early Adopters — 33% off · {priceInfo.remaining} cupo
                  {priceInfo.remaining === 1 ? "" : "s"} restante
                  {priceInfo.remaining === 1 ? "" : "s"}
                </p>
              )}
            </motion.div>

            <motion.p
              {...fadeUp(0.34)}
              style={{
                color: "#4e4d4d",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
                marginTop: 24,
              }}
            >
              PDF · Descarga inmediata · Garantía de devolución
            </motion.p>
          </div>

          {/* Right: 3D Mockup */}
          <EbookPreview />
        </div>
      </div>
    </section>
  );
}
