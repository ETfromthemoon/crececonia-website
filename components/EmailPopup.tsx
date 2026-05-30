"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "crececonia_subscribed";
const DISMISS_KEY = "crececonia_popup_dismissed_at";
const DELAY_MS = 25_000; // 25 segundos — menos invasivo
const DISMISS_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

export default function EmailPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Ya suscrito → nunca mostrar
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Dismiss reciente (< 30 días) → no mostrar
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    // Persiste el dismiss por 30 días para no fatigar usuarios recurrentes
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      // Llamada directa al backend autodrive.cl
      const res = await fetch("https://autodrive.cl/api/public/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "skills_page" }),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        setStatus("success");
        localStorage.setItem(STORAGE_KEY, "1");
        setTimeout(() => setVisible(false), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[80]"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[81] flex items-center justify-center px-6 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md p-8 pointer-events-auto"
              style={{
                background: "var(--carbon)",
                border: "1px solid rgba(217,179,106,0.2)",
                borderRadius: 4,
                boxShadow: "0 0 0 1px rgba(217,179,106,0.05), 0 32px 80px rgba(0,0,0,0.6)",
              }}
            >
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--smoke)" }}
                aria-label="Cerrar"
              >
                ×
              </button>

              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 1,
                  background: "linear-gradient(90deg, transparent, var(--champagne), transparent)",
                  opacity: 0.6,
                  borderRadius: "4px 4px 0 0",
                }}
              />

              {status === "success" ? (
                <div className="text-center py-4">
                  <p
                    className="text-3xl mb-3"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    🤖
                  </p>
                  <h3
                    className="font-light text-xl mb-2"
                    style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
                  >
                    ¡Ya estás dentro!
                  </h3>
                  <p className="text-sm" style={{ color: "var(--ash)" }}>
                    Te avisamos cada vez que publicamos una nueva skill.
                  </p>
                </div>
              ) : (
                <>
                  <p
                    className="text-xs mb-4 inline-block px-2 py-0.5"
                    style={{
                      color: "var(--champagne)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      background: "var(--gold-soft)",
                      border: "1px solid rgba(217,179,106,0.15)",
                      borderRadius: 2,
                    }}
                  >
                    Claude Code Skills
                  </p>

                  <h2
                    className="font-light text-2xl mb-3 leading-tight"
                    style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
                  >
                    Skills nuevas,{" "}
                    <em className="gradient-text" style={{ fontStyle: "italic" }}>
                      cada semana.
                    </em>
                  </h2>
                  <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--ash)", fontWeight: 300 }}>
                    Suscríbete y recibe en tu correo cada nueva skill para Claude Code que publiquemos. Gratis, sin spam.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                      className="w-full px-4 py-3 text-sm outline-none"
                      style={{
                        background: "var(--graphite)",
                        border: "1px solid rgba(30,30,31,0.9)",
                        borderRadius: 2,
                        color: "var(--bone)",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                    {status === "error" && (
                      <p className="text-xs" style={{ color: "var(--danger)" }}>
                        Algo salió mal. Intenta de nuevo.
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{
                        background: "var(--champagne)",
                        color: "var(--obsidian)",
                        borderRadius: 2,
                        fontSize: "0.875rem",
                      }}
                    >
                      {status === "loading" ? "Suscribiendo..." : "Suscribirme gratis →"}
                    </button>
                  </form>

                  <p
                    className="mt-3 text-xs text-center"
                    style={{ color: "var(--smoke)" }}
                  >
                    Sin spam · Puedes darte de baja cuando quieras
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
