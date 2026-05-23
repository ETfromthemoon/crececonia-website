"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WAButton } from "./GradientButton";
import ContactForm from "./ContactForm";

export default function FinalCTA() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <section
        id="contacto-wa"
        className="py-28 px-6 relative overflow-hidden"
        style={{ background: "var(--obsidian)" }}
      >
        {/* Dot pattern */}
        <div className="absolute inset-0 dot-pattern opacity-30" aria-hidden="true" />

        {/* Orbe champagne — superior izquierdo */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-5%", left: "-5%",
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(217,179,106,0.12), transparent 70%)",
            filter: "blur(80px)",
          }}
          aria-hidden="true"
        />
        {/* Orbe champagne dim — centro superior */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "0%", left: "50%",
            transform: "translateX(-50%)",
            width: 600, height: 400,
            background: "radial-gradient(ellipse, rgba(140,111,63,0.08), transparent 70%)",
            filter: "blur(80px)",
          }}
          aria-hidden="true"
        />
        {/* Orbe verde — inferior derecha */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-5%", right: "-5%",
            width: 420, height: 420,
            background: "radial-gradient(circle, rgba(37,211,102,0.08), transparent 70%)",
            filter: "blur(80px)",
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-2xl mx-auto text-center">
          <h2
            className="font-light mb-4 leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              color: "var(--bone)",
              letterSpacing: "-0.02em",
            }}
          >
            Dinos{" "}
            <em className="gradient-text">qué proceso te quita el sueño.</em>
          </h2>
          <p
            className="text-base mb-3 leading-relaxed"
            style={{ color: "var(--ash)", fontWeight: 300 }}
          >
            Respondemos en menos de 2 horas hábiles. Si no vemos fit real, te lo
            decimos y te recomendamos qué hacer.
          </p>
          <p
            className="text-xs mb-10"
            style={{
              color: "var(--champagne)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Cupos disponibles para junio 2026 · Agenda hoy
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <WAButton source="final-primary" size="lg">
              Recibir mi evaluación AI gratis
            </WAButton>
          </div>

          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs"
            style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            <span>Respuesta en menos de 2 horas hábiles</span>
            <span className="hidden sm:block">·</span>
            <span>30 min de diagnóstico sin compromiso</span>
            <span className="hidden sm:block">·</span>
            <span>Confidencial con NDA incluido</span>
            <span className="hidden sm:block">·</span>
            <span>Si no hay fit, te recomendamos qué hacer</span>
          </div>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
              aria-hidden="true"
            />

            {/* Modal panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
              aria-modal="true"
              role="dialog"
              aria-label="Formulario de contacto"
            >
              <div
                className="pointer-events-auto w-full max-w-md max-h-[92vh] overflow-y-auto"
                style={{
                  background: "var(--graphite)",
                  border: "1px solid rgba(217,179,106,0.18)",
                  borderRadius: "1.25rem",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 4px 20px rgba(0,0,0,0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-3">
                  <h3
                    style={{
                      color: "var(--bone)",
                      fontFamily: "var(--font-display)",
                      fontSize: "1.2rem",
                      fontWeight: 300,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Envía tu propuesta
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-xl leading-none"
                    style={{ color: "var(--smoke)", background: "rgba(255,255,255,0.05)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--bone)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--smoke)")}
                    aria-label="Cerrar formulario"
                  >
                    ×
                  </button>
                </div>

                {/* Form */}
                <div className="px-6 pb-4">
                  <ContactForm noCard />
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 text-center">
                  <p className="text-sm" style={{ color: "var(--smoke)" }}>
                    ¿Prefieres WhatsApp?{" "}
                    <button
                      onClick={() => setShowForm(false)}
                      className="underline transition-colors"
                      style={{ color: "var(--ash)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--champagne)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ash)")}
                    >
                      Cierra este formulario
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
