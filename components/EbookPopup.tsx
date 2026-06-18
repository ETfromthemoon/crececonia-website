"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "crececonia_ebook_popup_v1";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const DELAY_MS = 4_000;

export default function EbookPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

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

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
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
            }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo ebook de CrececonIA"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              width: "min(480px, calc(100vw - 32px))",
              background: "var(--carbon)",
              border: "1px solid rgba(30,30,31,0.9)",
              borderTop: "3px solid var(--champagne)",
              borderRadius: 6,
              padding: "36px 32px 32px",
              boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Close */}
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
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bone)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
            >
              ✕
            </button>

            {/* Eyebrow */}
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

            {/* Title */}
            <h2
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

            {/* Description */}
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.82rem",
                color: "var(--ash)",
                lineHeight: 1.8,
                marginBottom: 24,
              }}
            >
              Lo que la documentación oficial no te enseña. Dominá Claude en 7 días — aunque nunca hayas usado IA antes.
            </p>

            {/* Price badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(217,179,106,0.08)",
                border: "1px solid rgba(217,179,106,0.25)",
                borderRadius: 3,
                padding: "6px 12px",
                marginBottom: 28,
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
                Early Access · desde $10.800 CLP
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <a
                href="/ebook/de-cero-a-claude-en-una-semana"
                onClick={dismiss}
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
        </>
      )}
    </AnimatePresence>
  );
}
