"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import EbookPreview from "./EbookPreview";
import type { PriceInfo } from "@/lib/ebook-pricing";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: EASE },
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
      className="relative flex items-center section-y-spacious px-6 overflow-hidden"
      style={{ minHeight: "88vh" }}
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="dot-pattern opacity-50" />
        <div
          className="orb-animate absolute"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(217,179,106,0.07) 0%, transparent 70%)",
            top: "-20%",
            left: "-10%",
          }}
        />
        <div
          className="orb-animate absolute"
          style={{
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(217,179,106,0.05) 0%, transparent 70%)",
            bottom: "-15%",
            right: "-5%",
            animationDelay: "3s",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-center">
          {/* Left: copy + CTA */}
          <div>
            <motion.p {...fadeUp(0.04)} className="eyebrow mb-5">
              Ebook · CrececonIA
            </motion.p>

            <motion.h1
              {...fadeUp(0.1)}
              className="font-light leading-tight mb-6"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--bone)",
              }}
            >
              De cero a{" "}
              <em className="gradient-text" style={{ fontStyle: "italic" }}>
                Claude
              </em>{" "}
              en una semana.
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              className="text-lg leading-relaxed mb-10"
              style={{ color: "var(--ash)", fontWeight: 300, maxWidth: 460 }}
            >
              La guía práctica para dominar Claude Code sin perder semanas
              probando. Desde la instalación hasta prompts que generan código
              en producción — todo en 120 páginas.
            </motion.p>

            <motion.div
              {...fadeUp(0.26)}
              style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}
            >
              <button
                onClick={scrollToComprar}
                className="btn-evaluacion btn-lg"
                style={{ cursor: "pointer" }}
              >
                {formattedPrice
                  ? `Comprar ahora · $${formattedPrice} CLP`
                  : "Comprar ahora"}
              </button>

              {priceInfo?.tier === "super-early" && (
                <p
                  className="text-sm"
                  style={{
                    color: "var(--smoke)",
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
                  className="text-sm"
                  style={{
                    color: "var(--smoke)",
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
              className="text-sm mt-8"
              style={{ color: "var(--smoke)", fontWeight: 300 }}
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
