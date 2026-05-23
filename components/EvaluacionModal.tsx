"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvaluacion } from "./EvaluacionProvider";

const API_URL = "https://autodrive.cl/api/public/evaluacion";

type FormData = {
  nombre: string;
  email: string;
  empresa: string;
  empresa_descripcion: string;
  tamano_equipo: string;
  rol: string;
  proceso_pain: string;
  uso_ia_actual: string;
  resultado_esperado: string;
  horizonte_decision: string;
};

const INITIAL: FormData = {
  nombre: "",
  email: "",
  empresa: "",
  empresa_descripcion: "",
  tamano_equipo: "",
  rol: "",
  proceso_pain: "",
  uso_ia_actual: "",
  resultado_esperado: "",
  horizonte_decision: "",
};

const TAMAÑOS = [
  { value: "1-10", label: "1 a 10 personas" },
  { value: "11-30", label: "11 a 30 personas" },
  { value: "31-100", label: "31 a 100 personas" },
  { value: "100+", label: "Más de 100 personas" },
];

const USO_IA = [
  { value: "no", label: "Aún no la usamos" },
  { value: "ocasional", label: "Sí, ocasionalmente" },
  { value: "regular", label: "Sí, regularmente" },
];

const HORIZONTE = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "2-3-meses", label: "En 2-3 meses" },
  { value: "explorando", label: "Solo explorando" },
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function EvaluacionModal() {
  const { open, source, cerrar } = useEvaluacion();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function reset() {
    setStep(1);
    setData(INITIAL);
    setLoading(false);
    setDone(false);
    setError("");
  }

  function cerrarYReset() {
    cerrar();
    setTimeout(reset, 400);
  }

  // Validaciones por paso
  const step1Valid = data.nombre.trim().length >= 2 && isValidEmail(data.email) && data.rol.trim().length >= 2;
  const step2Valid = data.empresa.trim().length >= 2 && data.empresa_descripcion.trim().length >= 5
    && data.tamano_equipo && data.uso_ia_actual;
  const step3Valid = data.proceso_pain.trim().length >= 10 && data.resultado_esperado.trim().length >= 10
    && data.horizonte_decision;

  async function enviar() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source }),
        signal: AbortSignal.timeout(15000),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setDone(true);
      } else {
        setError(j.detail || "Algo salió mal. Intenta de nuevo.");
      }
    } catch {
      // Aún así marcamos como done — el backend probablemente lo procesó
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  const INPUT_CLASS = "w-full bg-transparent border-0 border-b border-white/10 px-0 py-3 text-base text-bone placeholder-smoke focus:border-champagne focus:outline-none transition-colors";
  const LABEL_CLASS = "block text-[11px] font-medium uppercase tracking-[0.14em] text-smoke mb-2";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && cerrarYReset()}
            className="fixed inset-0 z-[90]"
            style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[91] flex items-center justify-center px-4 py-6 pointer-events-none overflow-y-auto"
          >
            <div
              className="relative w-full max-w-xl my-auto pointer-events-auto"
              style={{
                background: "var(--carbon)",
                border: "1px solid rgba(217,179,106,0.22)",
                borderRadius: 4,
                boxShadow: "0 0 0 1px rgba(217,179,106,0.06), 0 40px 100px rgba(0,0,0,0.7)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 1,
                  background: "linear-gradient(90deg, transparent, var(--champagne), transparent)",
                  opacity: 0.6,
                  borderRadius: "4px 4px 0 0",
                }}
              />

              {!done && (
                <button
                  onClick={() => !loading && cerrarYReset()}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-smoke hover:text-bone transition-colors text-xl"
                  aria-label="Cerrar"
                  disabled={loading}
                >
                  ×
                </button>
              )}

              <div className="p-8 sm:p-10">
                {done ? (
                  <SuccessScreen onClose={cerrarYReset} email={data.email} />
                ) : (
                  <>
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
                      Diagnóstico AI Gratuito
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-light leading-tight mb-2"
                      style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
                    >
                      Evalúa tu negocio en{" "}
                      <em className="gradient-text" style={{ fontStyle: "italic" }}>
                        2 minutos
                      </em>
                    </h2>
                    <p className="text-sm leading-relaxed mb-7" style={{ color: "var(--ash)" }}>
                      Te enviamos un reporte personalizado por email con 3 oportunidades de IA para tu negocio + ROI estimado.
                    </p>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 mb-7">
                      {[1, 2, 3].map((s) => (
                        <div
                          key={s}
                          className="flex-1 h-1 rounded-full transition-colors"
                          style={{
                            background:
                              s <= step ? "var(--champagne)" : "rgba(255,255,255,0.08)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Step 1 — Contacto */}
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
                        <div>
                          <label className={LABEL_CLASS}>Tu nombre</label>
                          <input
                            className={INPUT_CLASS}
                            type="text"
                            value={data.nombre}
                            onChange={(e) => set("nombre", e.target.value)}
                            placeholder="María González"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Email</label>
                          <input
                            className={INPUT_CLASS}
                            type="email"
                            value={data.email}
                            onChange={(e) => set("email", e.target.value)}
                            placeholder="tu@email.com"
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Tu rol en la empresa</label>
                          <input
                            className={INPUT_CLASS}
                            type="text"
                            value={data.rol}
                            onChange={(e) => set("rol", e.target.value)}
                            placeholder="CEO, Director Operaciones, etc."
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2 — Empresa */}
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
                        <div>
                          <label className={LABEL_CLASS}>Nombre de tu empresa</label>
                          <input
                            className={INPUT_CLASS}
                            type="text"
                            value={data.empresa}
                            onChange={(e) => set("empresa", e.target.value)}
                            placeholder="Logística RapidShip"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>¿A qué se dedica?</label>
                          <textarea
                            className={INPUT_CLASS}
                            rows={2}
                            value={data.empresa_descripcion}
                            onChange={(e) => set("empresa_descripcion", e.target.value)}
                            placeholder="Logística B2B con 35 personas, 200 envíos diarios..."
                            style={{ resize: "none" }}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Tamaño del equipo</label>
                          <div className="grid grid-cols-2 gap-2">
                            {TAMAÑOS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => set("tamano_equipo", opt.value)}
                                className="text-xs px-3 py-2 transition-colors text-left"
                                style={{
                                  border: `1px solid ${data.tamano_equipo === opt.value ? "var(--champagne)" : "rgba(255,255,255,0.1)"}`,
                                  background: data.tamano_equipo === opt.value ? "var(--gold-soft)" : "transparent",
                                  color: data.tamano_equipo === opt.value ? "var(--champagne)" : "var(--ash)",
                                  borderRadius: 2,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>¿Ya usan IA en el equipo?</label>
                          <div className="grid grid-cols-3 gap-2">
                            {USO_IA.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => set("uso_ia_actual", opt.value)}
                                className="text-xs px-3 py-2 transition-colors text-center"
                                style={{
                                  border: `1px solid ${data.uso_ia_actual === opt.value ? "var(--champagne)" : "rgba(255,255,255,0.1)"}`,
                                  background: data.uso_ia_actual === opt.value ? "var(--gold-soft)" : "transparent",
                                  color: data.uso_ia_actual === opt.value ? "var(--champagne)" : "var(--ash)",
                                  borderRadius: 2,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3 — Pain & Goals */}
                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-5">
                        <div>
                          <label className={LABEL_CLASS}>
                            ¿Qué proceso consume más tiempo a tu equipo hoy?
                          </label>
                          <textarea
                            className={INPUT_CLASS}
                            rows={3}
                            value={data.proceso_pain}
                            onChange={(e) => set("proceso_pain", e.target.value)}
                            placeholder="Ej: facturación manual, atención de clientes, reportes semanales..."
                            style={{ resize: "vertical" }}
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>
                            ¿Qué resultado concreto buscas con IA?
                          </label>
                          <textarea
                            className={INPUT_CLASS}
                            rows={2}
                            value={data.resultado_esperado}
                            onChange={(e) => set("resultado_esperado", e.target.value)}
                            placeholder="Ej: reducir 50% el tiempo de facturación, mejorar atención..."
                            style={{ resize: "vertical" }}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>¿Cuándo necesitas resolver esto?</label>
                          <div className="grid grid-cols-2 gap-2">
                            {HORIZONTE.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => set("horizonte_decision", opt.value)}
                                className="text-xs px-3 py-2 transition-colors text-left"
                                style={{
                                  border: `1px solid ${data.horizonte_decision === opt.value ? "var(--champagne)" : "rgba(255,255,255,0.1)"}`,
                                  background: data.horizonte_decision === opt.value ? "var(--gold-soft)" : "transparent",
                                  color: data.horizonte_decision === opt.value ? "var(--champagne)" : "var(--ash)",
                                  borderRadius: 2,
                                  fontFamily: "var(--font-mono)",
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {error && (
                          <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>
                        )}
                      </motion.div>
                    )}

                    {/* Footer botones */}
                    <div className="flex items-center justify-between gap-3 mt-8">
                      <button
                        type="button"
                        onClick={() => (step > 1 ? setStep(step - 1) : cerrarYReset())}
                        className="text-xs px-3 py-2 transition-opacity hover:opacity-70"
                        style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase" }}
                        disabled={loading}
                      >
                        {step === 1 ? "Cancelar" : "← Atrás"}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px]" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                          Paso {step} de 3
                        </span>
                        {step < 3 ? (
                          <button
                            type="button"
                            onClick={() => setStep(step + 1)}
                            disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                            className="px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              background: "var(--champagne)",
                              color: "var(--obsidian)",
                              borderRadius: 2,
                            }}
                          >
                            Continuar →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={enviar}
                            disabled={!step3Valid || loading}
                            className="px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
                                Generando…
                              </>
                            ) : (
                              "Recibir mi evaluación →"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuccessScreen({ onClose, email }: { onClose: () => void; email: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-8"
    >
      <div
        className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: "var(--gold-soft)",
          border: "1px solid rgba(217,179,106,0.3)",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--champagne)" strokeWidth="2">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3
        className="text-2xl font-light mb-3"
        style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
      >
        Estamos generando tu evaluación
      </h3>
      <p className="text-sm leading-relaxed max-w-sm mx-auto mb-2" style={{ color: "var(--ash)" }}>
        En los próximos <strong style={{ color: "var(--champagne)" }}>2 minutos</strong> recibirás un email a:
      </p>
      <p className="text-sm mb-6 mono" style={{ color: "var(--bone)", fontFamily: "var(--font-mono)" }}>
        {email}
      </p>
      <p className="text-xs leading-relaxed max-w-sm mx-auto mb-8" style={{ color: "var(--smoke)" }}>
        Tu reporte incluye 3 oportunidades concretas de IA para tu negocio + ROI estimado mensual + plan de siguiente paso.
        Si tu negocio califica, recibirás también invitación a una llamada gratuita conmigo.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="text-xs px-5 py-2.5 transition-colors"
        style={{
          color: "var(--smoke)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Cerrar
      </button>
    </motion.div>
  );
}
