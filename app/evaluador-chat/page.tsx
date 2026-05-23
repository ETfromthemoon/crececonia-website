"use client";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = "https://autodrive.cl";

type PreguntaActual = {
  key: string;
  pregunta: string;
  tipo: "text" | "textarea" | "email" | "choice";
  opciones?: string[];
};

type Mensaje =
  | { rol: "bot"; texto: string }
  | { rol: "user"; texto: string };

export default function EvaluadorChatPage() {
  const [iniciado, setIniciado] = useState(false);
  const [token, setToken] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState<PreguntaActual | null>(null);
  const [paso, setPaso] = useState(0);
  const [totalPasos, setTotalPasos] = useState(10);
  const [input, setInput] = useState("");
  const [completado, setCompletado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes]);

  async function iniciar() {
    const r = await fetch(`${API_BASE}/api/public/chatbot/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_code: refCode }),
    });
    if (!r.ok) return;
    const d = await r.json();
    setToken(d.token);
    setPregunta(d.pregunta_actual);
    setPaso(0);
    setTotalPasos(d.total_pasos);
    setMensajes([{ rol: "bot", texto: d.pregunta_actual.pregunta }]);
    setIniciado(true);
  }

  async function responder(respuestaTexto: string) {
    if (!respuestaTexto.trim() || !token) return;
    setEnviando(true);
    setMensajes((m) => [...m, { rol: "user", texto: respuestaTexto }]);
    setInput("");

    const r = await fetch(`${API_BASE}/api/public/chatbot/responder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, respuesta: respuestaTexto }),
    });
    setEnviando(false);

    if (!r.ok) {
      setMensajes((m) => [...m, { rol: "bot", texto: "Hmm, algo no salió bien. ¿Probás de nuevo?" }]);
      return;
    }
    const d = await r.json();

    if (d.completada) {
      setMensajes((m) => [...m, { rol: "bot", texto: d.mensaje }]);
      setCompletado(true);
      setPregunta(null);
      return;
    }

    setMensajes((m) => [...m, { rol: "bot", texto: d.pregunta_actual.pregunta }]);
    setPregunta(d.pregunta_actual);
    setPaso(d.paso);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    responder(input);
  }

  const progreso = totalPasos > 0 ? Math.round((paso / totalPasos) * 100) : 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: "var(--obsidian)", paddingTop: 128, paddingBottom: 96 }}>
        <div className="max-w-3xl mx-auto px-6">

          {!iniciado && (
            <div className="text-center py-20">
              <p className="text-xs mb-5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Evaluador AI · Conversacional
              </p>
              <h1 className="font-light mb-6 leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 3.6rem)", color: "var(--bone)" }}>
                ¿Tu negocio es candidato para automatización con IA?
              </h1>
              <p className="mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "var(--ash)", fontSize: "clamp(1.05rem, 2vw, 1.2rem)", lineHeight: 1.6, fontWeight: 300 }}>
                10 preguntas, 3 minutos. Te devuelvo un diagnóstico personalizado en tu inbox.
              </p>
              <button onClick={iniciar}
                className="py-3 px-8 font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.95rem" }}>
                Empezar evaluación →
              </button>
            </div>
          )}

          {iniciado && (
            <>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5 text-xs" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  <span>Paso {paso + (completado ? 0 : 1)} de {totalPasos}</span>
                  <span>{completado ? 100 : progreso}%</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completado ? 100 : progreso}%`, background: "var(--champagne)", transition: "width 0.3s" }} />
                </div>
              </div>

              {/* Chat */}
              <div ref={scrollRef}
                className="space-y-3 mb-4 overflow-y-auto"
                style={{ minHeight: 360, maxHeight: 460, paddingRight: 4 }}>
                {mensajes.map((m, i) => (
                  <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: m.rol === "user" ? "var(--gold-soft)" : "var(--carbon)",
                        color: m.rol === "user" ? "var(--champagne)" : "var(--bone)",
                        border: m.rol === "user" ? "1px solid rgba(217,179,106,0.25)" : "1px solid rgba(30,30,31,0.9)",
                        borderRadius: 4,
                      }}>
                      {m.texto}
                    </div>
                  </div>
                ))}
                {enviando && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2.5 text-sm" style={{ background: "var(--carbon)", color: "var(--smoke)", borderRadius: 4 }}>
                      ...
                    </div>
                  </div>
                )}
              </div>

              {/* Input área */}
              {!completado && pregunta && (
                <form onSubmit={handleSubmit} className="space-y-2">
                  {pregunta.tipo === "choice" && pregunta.opciones && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pregunta.opciones.map((o) => (
                        <button key={o} type="button" onClick={() => responder(o)}
                          disabled={enviando}
                          className="py-2.5 px-4 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{ background: "var(--carbon)", color: "var(--bone)", border: "1px solid rgba(217,179,106,0.25)", borderRadius: 2 }}>
                          {o}
                        </button>
                      ))}
                    </div>
                  )}

                  {(pregunta.tipo === "text" || pregunta.tipo === "email") && (
                    <div className="flex gap-2">
                      <input type={pregunta.tipo === "email" ? "email" : "text"}
                        value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder="Tu respuesta..."
                        disabled={enviando}
                        autoFocus
                        className="flex-1 px-3 py-2.5 text-sm outline-none"
                        style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                      <button type="submit" disabled={enviando || !input.trim()}
                        className="px-5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2 }}>
                        →
                      </button>
                    </div>
                  )}

                  {pregunta.tipo === "textarea" && (
                    <div className="space-y-2">
                      <textarea value={input} onChange={(e) => setInput(e.target.value)}
                        placeholder="Tu respuesta..."
                        disabled={enviando}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                        style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)", fontFamily: "inherit" }} />
                      <button type="submit" disabled={enviando || !input.trim()}
                        className="py-2.5 px-5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2 }}>
                        Enviar →
                      </button>
                    </div>
                  )}
                </form>
              )}

              {completado && (
                <div className="text-center mt-6 p-6" style={{ background: "var(--carbon)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 4 }}>
                  <p style={{ color: "rgb(110,231,183)", fontSize: "0.95rem" }}>
                    ✓ Evaluación completa. Revisá tu inbox.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
