"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_URL = "https://autodrive.cl/api/public/solicitar-llamada";

function SolicitarContent() {
  const params = useSearchParams();
  const token = params.get("t");

  const [horarios, setHorarios] = useState<string[]>(["", "", ""]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Si no hay token, mostrar error
  useEffect(() => {
    if (!token) setError("Link inválido. Asegúrate de hacer click desde el email que recibiste.");
  }, [token]);

  function setHorario(idx: number, value: string) {
    setHorarios((h) => h.map((v, i) => (i === idx ? value : v)));
  }

  async function enviar() {
    if (!token) return;
    const horariosFiltrados = horarios.filter((h) => h.trim().length > 5);
    if (horariosFiltrados.length === 0) {
      setError("Indica al menos 1 horario preferido (ej: 'Lunes 10:00 hrs').");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, horarios_preferidos: horariosFiltrados, mensaje }),
        signal: AbortSignal.timeout(15000),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setDone(true);
      } else {
        setError(j.detail || "Algo salió mal. Intenta de nuevo o escríbenos a hola@crececonia.cl.");
      }
    } catch {
      setError("No pudimos enviar la solicitud. Por favor escríbenos a hola@crececonia.cl.");
    } finally {
      setLoading(false);
    }
  }

  const INPUT_CLASS = "w-full bg-transparent border-0 border-b border-white/10 px-0 py-3 text-base text-bone placeholder-smoke focus:border-champagne focus:outline-none transition-colors";
  const LABEL_CLASS = "block text-[11px] font-medium uppercase tracking-[0.14em] text-smoke mb-2";

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div
            className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--gold-soft)", border: "1px solid rgba(217,179,106,0.3)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--champagne)" strokeWidth="2">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1
            className="font-light leading-tight mb-5"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "var(--bone)" }}
          >
            Recibí tu solicitud
          </h1>
          <p className="text-base leading-relaxed mb-3 max-w-lg mx-auto" style={{ color: "var(--ash)" }}>
            En menos de <strong style={{ color: "var(--champagne)" }}>2 horas hábiles</strong> te respondo por email con un link de Google Meet para los horarios que indicaste.
          </p>
          <p className="text-sm leading-relaxed max-w-lg mx-auto" style={{ color: "var(--smoke)" }}>
            Revisa tu bandeja de entrada (y si no llega en 2 horas, también la carpeta de Promociones).
          </p>
          <div className="mt-12">
            <a
              href="/"
              className="text-xs transition-opacity hover:opacity-70"
              style={{
                color: "var(--smoke)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              ← Volver al inicio
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-32 pb-24">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p
          className="text-[11px] mb-3 inline-block px-2 py-0.5"
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
          Diagnóstico gratuito · 30 min
        </p>
        <h1
          className="font-light leading-tight mb-4"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--bone)" }}
        >
          Agendemos tu{" "}
          <em className="gradient-text" style={{ fontStyle: "italic" }}>
            llamada de 30 minutos.
          </em>
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: "var(--ash)" }}>
          Indícame 3 horarios que te acomoden y te respondo en menos de 2 horas hábiles con un link de Google Meet para el que mejor calce con mi agenda.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <label className={LABEL_CLASS}>Horario preferido 1</label>
            <input
              className={INPUT_CLASS}
              type="text"
              value={horarios[0]}
              onChange={(e) => setHorario(0, e.target.value)}
              placeholder="Ej: Lunes 10:00 hrs (zona Santiago)"
              autoFocus
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Horario alternativo 2</label>
            <input
              className={INPUT_CLASS}
              type="text"
              value={horarios[1]}
              onChange={(e) => setHorario(1, e.target.value)}
              placeholder="Ej: Martes 15:00 hrs"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Horario alternativo 3 (opcional)</label>
            <input
              className={INPUT_CLASS}
              type="text"
              value={horarios[2]}
              onChange={(e) => setHorario(2, e.target.value)}
              placeholder="Ej: Jueves 9:00 hrs"
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Algo que quieras agregar (opcional)</label>
            <textarea
              className={INPUT_CLASS}
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Algún tema específico que quieras tratar, o contexto adicional..."
              style={{ resize: "vertical" }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#EF4444" }}>
              {error}
            </p>
          )}

          <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
            <p className="text-xs" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
              Sin compromiso · Confidencial · NDA disponible
            </p>
            <button
              type="button"
              onClick={enviar}
              disabled={!token || loading}
              className="px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: "var(--champagne)",
                color: "var(--obsidian)",
                borderRadius: 2,
              }}
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-obsidian border-t-transparent rounded-full inline-block"
                  />
                  Enviando…
                </>
              ) : (
                "Solicitar llamada →"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Navbar />
      <main style={{ background: "var(--obsidian)", minHeight: "100vh" }}>
        <Suspense fallback={<div className="pt-32 px-6 text-center" style={{ color: "var(--smoke)" }}>Cargando…</div>}>
          <SolicitarContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
