"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "crececonia_ebook_popup_v1";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DELAY_MS = 4_000;

interface PriceData {
  price: number;
  tier: string;
  remaining: number | null;
  originalPrice: number;
}

export default function EbookPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [priceData, setPriceData] = useState<PriceData | null>(null);

  useEffect(() => {
    fetch("/api/ebook/cupos")
      .then((r) => r.json())
      .then(setPriceData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && Date.now() - parseInt(stored, 10) < COOLDOWN_MS) return;
    } catch {
      // localStorage no disponible
    }

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setVisible(false);
  }

  const formattedPrice = priceData?.price
    ? priceData.price.toLocaleString("es-CL")
    : null;

  const tierLabel =
    priceData?.tier === "super-early"
      ? "Super Early · 60% OFF"
      : priceData?.tier === "early"
        ? "Early Adopters · 33% OFF"
        : null;

  const remainingText =
    priceData?.remaining != null && priceData.remaining <= 5
      ? `Solo quedan ${priceData.remaining} cupo${priceData.remaining === 1 ? "" : "s"}`
      : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          className="ebook-popup-backdrop"
        >
          <style>{`
            .ebook-popup-backdrop {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            @media (max-width: 639px) {
              .ebook-popup-backdrop {
                align-items: flex-end;
                padding: 0;
              }
            }
          `}</style>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo ebook de CrececonIA"
            onClick={(e) => e.stopPropagation()}
            className="ebook-popup-card"
          >
            <style>{`
              .ebook-popup-card {
                position: relative;
                width: min(480px, calc(100vw - 32px));
                max-height: calc(100vh - 64px);
                overflow-y: auto;
                background: var(--carbon);
                border: 1px solid rgba(30,30,31,0.9);
                border-top: 3px solid var(--champagne);
                border-radius: 6px;
                padding: 36px 32px 32px;
                box-shadow: 0 32px 64px rgba(0,0,0,0.6);
              }

              @media (max-width: 639px) {
                .ebook-popup-card {
                  width: 100%;
                  max-height: calc(100vh - 32px);
                  border-radius: 14px 14px 0 0;
                  padding: 24px 20px 28px;
                  box-shadow: 0 -8px 40px rgba(0,0,0,0.6);
                }

                .ebook-popup-title {
                  font-size: clamp(1.3rem, 7vw, 1.8rem);
                }

                .ebook-popup-desc {
                  font-size: 0.78rem;
                }

                .ebook-popup-actions {
                  flex-direction: column;
                  align-items: stretch;
                  gap: 12px;
                }

                .ebook-popup-cta {
                  font-size: 0.8rem;
                  padding: 14px 24px;
                  justify-content: center;
                }

                .ebook-popup-dismiss-btn {
                  font-size: 0.78rem;
                  padding: 10px 0;
                }
              }
            `}</style>

            <button
              onClick={dismiss}
              aria-label="Cerrar"
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--smoke)",
                lineHeight: 1,
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bone)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "var(--champagne)",
                marginBottom: 20,
              }}
            >
              Nuevo · Ebook
            </p>

            <h2
              className="ebook-popup-title"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 300,
                fontSize: "clamp(1.6rem, 4vw, 2rem)",
                lineHeight: 1.15,
                color: "var(--bone)",
                marginBottom: 16,
                letterSpacing: "-0.01em",
              }}
            >
              De cero a Claude
              <br />
              <em style={{ color: "var(--champagne)", fontStyle: "italic" }}>en una semana</em>
            </h2>

            <p
              className="ebook-popup-desc"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.82rem",
                color: "var(--ash)",
                lineHeight: 1.7,
                marginBottom: 20,
              }}
            >
              Lo que la documentación oficial no te enseña. Dominá Claude en 7 días — aunque nunca hayas usado IA antes.
            </p>

            {formattedPrice && (
              <div
                style={{
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 6,
                  background: "rgba(217,179,106,0.08)",
                  border: "1px solid rgba(217,179,106,0.25)",
                  borderRadius: 3,
                  padding: "8px 14px",
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    color: "var(--champagne)",
                    letterSpacing: "0.06em",
                  }}
                >
                  ${formattedPrice} CLP
                </span>
                {tierLabel && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "var(--smoke)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {tierLabel}
                  </span>
                )}
                {remainingText && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      color: "#f87171",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {remainingText}
                  </span>
                )}
              </div>
            )}

            <div
              className="ebook-popup-actions"
              style={{ display: "flex", alignItems: "center", gap: 20 }}
            >
              <a
                href="/ebook/de-cero-a-claude-en-una-semana"
                onClick={dismiss}
                className="ebook-popup-cta"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--champagne)",
                  color: "var(--obsidian)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "12px 24px",
                  borderRadius: 3,
                  fontWeight: 500,
                }}
              >
                Ver el ebook
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>

              <button
                onClick={dismiss}
                className="ebook-popup-dismiss-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.72rem",
                  color: "var(--smoke)",
                  letterSpacing: "0.06em",
                  padding: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ash)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
              >
                No, gracias
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
