"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = "https://autodrive.cl";
const MIN_EJEMPLOS = 2;
const MAX_EJEMPLOS = 5;

type Formato = "post" | "email" | "tweet" | "newsletter";

export default function MiVozPage() {
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1); // 1=ejemplos, 2=tema, 3=resultado, 4=email
  const [ejemplos, setEjemplos] = useState<string[]>(["", "", ""]);
  const [tema, setTema] = useState("");
  const [formato, setFormato] = useState<Formato>("post");

  const [token, setToken] = useState("");
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [analisis, setAnalisis] = useState("");
  const [textos, setTextos] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";

  function updateEjemplo(i: number, val: string) {
    const copy = [...ejemplos];
    copy[i] = val;
    setEjemplos(copy);
  }

  function addEjemplo() {
    if (ejemplos.length < MAX_EJEMPLOS) setEjemplos([...ejemplos, ""]);
  }

  const ejemplosValidos = ejemplos.filter((e) => e.trim().length > 20).length;
  const puedeAvanzar = ejemplosValidos >= MIN_EJEMPLOS;

  async function iniciar() {
    const r = await fetch(`${API_BASE}/api/public/mi-voz/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref_code: refCode }),
    });
    if (r.ok) {
      const d = await r.json();
      setToken(d.token);
      return d.token;
    }
    return "";
  }

  async function generar() {
    if (!tema.trim() || tema.length < 5) {
      setError("Decime sobre qué tema querés los textos");
      return;
    }
    setError("");
    setGenerando(true);
    try {
      const t = token || (await iniciar());
      if (!t) { setError("No pude iniciar la sesión"); setGenerando(false); return; }

      const r = await fetch(`${API_BASE}/api/public/mi-voz/generar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: t,
          ejemplos: ejemplos.filter((e) => e.trim().length > 20),
          tema,
          formato,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.detail || "Error generando textos");
        setGenerando(false);
        return;
      }
      const d = await r.json();
      setAnalisis(d.analisis_tono || "");
      setTextos(d.textos || []);
      setPaso(3);
    } catch (e) {
      setError("Error de red");
    } finally {
      setGenerando(false);
    }
  }

  async function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setEnviando(true);
    const r = await fetch(`${API_BASE}/api/public/mi-voz/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, nombre }),
    });
    setEnviando(false);
    if (r.ok) setEnviado(true);
  }

  async function copiar(texto: string, idx: number) {
    try {
      await navigator.clipboard.writeText(texto);
      const el = document.getElementById(`copy-btn-${idx}`);
      if (el) {
        const orig = el.textContent;
        el.textContent = "✓ copiado";
        setTimeout(() => { if (el) el.textContent = orig; }, 1500);
      }
    } catch {}
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 128 }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs mb-5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Generador gratuito · 5 minutos
          </p>
          <h1 className="font-light mb-6 leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 3.6rem)", color: "var(--bone)" }}>
            Mi voz, no IA.
          </h1>
          <p className="leading-relaxed mb-12" style={{ color: "var(--ash)", fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.6, fontWeight: 300 }}>
            Pegá 3 textos tuyos. Recibí 5 piezas nuevas que <strong style={{ color: "var(--bone)" }}>suenan a vos</strong>, no a ChatGPT.
          </p>

          {/* Progress */}
          <div className="flex gap-1 mb-8">
            {[1, 2, 3].map((p) => (
              <div key={p} className="flex-1 h-0.5" style={{ background: paso >= p ? "var(--champagne)" : "rgba(255,255,255,0.08)" }} />
            ))}
          </div>

          {/* PASO 1: Ejemplos */}
          {paso === 1 && (
            <div className="space-y-4">
              <p className="text-sm mb-3" style={{ color: "var(--ash)" }}>
                <strong>Paso 1 de 3</strong> · Pegá entre 2 y 5 ejemplos de cómo escribís (posts, emails, notas LinkedIn, lo que sea).
              </p>
              {ejemplos.map((ej, i) => (
                <div key={i}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                    Ejemplo {i + 1} {i < MIN_EJEMPLOS && <span style={{ color: "rgb(248,113,113)" }}>*</span>}
                  </label>
                  <textarea value={ej} onChange={(e) => updateEjemplo(i, e.target.value)}
                    rows={4} placeholder="Pegá acá un post, email, mensaje, lo que sea (mínimo 1-2 párrafos)..."
                    className="w-full px-3 py-2 text-sm outline-none resize-vertical"
                    style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                  <p className="text-[10px] mt-1" style={{ color: ej.trim().length > 20 ? "rgb(110,231,183)" : "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                    {ej.trim().length} caracteres {ej.trim().length > 20 ? "✓" : "(mín 20)"}
                  </p>
                </div>
              ))}
              {ejemplos.length < MAX_EJEMPLOS && (
                <button onClick={addEjemplo} className="text-xs underline" style={{ color: "var(--smoke)" }}>
                  + Agregar otro ejemplo (mejor calidad con más ejemplos)
                </button>
              )}
              <button onClick={() => puedeAvanzar && setPaso(2)} disabled={!puedeAvanzar}
                className="w-full py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-30"
                style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.95rem" }}>
                Siguiente ({ejemplosValidos}/{MIN_EJEMPLOS} ejemplos listos) →
              </button>
            </div>
          )}

          {/* PASO 2: Tema */}
          {paso === 2 && (
            <div className="space-y-4">
              <p className="text-sm mb-3" style={{ color: "var(--ash)" }}>
                <strong>Paso 2 de 3</strong> · ¿Sobre qué querés los 5 textos nuevos?
              </p>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Tema o ángulo
                </label>
                <textarea value={tema} onChange={(e) => setTema(e.target.value)} rows={3}
                  placeholder="Ej: 'La importancia de medir antes de automatizar procesos en una pyme', 'Por qué dejé de usar Excel para gestionar leads', 'Cómo elegir un proveedor de IA'..."
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
              </div>
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Formato
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["post", "email", "tweet", "newsletter"] as Formato[]).map((f) => (
                    <button key={f} type="button" onClick={() => setFormato(f)}
                      className="py-2 px-3 text-xs transition-opacity"
                      style={{
                        background: formato === f ? "var(--gold-soft)" : "var(--carbon)",
                        color: formato === f ? "var(--champagne)" : "var(--ash)",
                        border: `1px solid ${formato === f ? "rgba(217,179,106,0.4)" : "rgba(30,30,31,0.9)"}`,
                        borderRadius: 2,
                      }}>
                      {f === "post" ? "Post LinkedIn/IG" : f === "email" ? "Email" : f === "tweet" ? "Tweet" : "Newsletter"}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs" style={{ color: "rgb(248,113,113)" }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setPaso(1)} className="px-4 py-3 text-sm" style={{ color: "var(--smoke)" }}>
                  ← Volver
                </button>
                <button onClick={generar} disabled={generando || tema.trim().length < 5}
                  className="flex-1 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-30"
                  style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.95rem" }}>
                  {generando ? "Analizando tu voz y generando... (puede tardar 10-15s)" : "Generar 5 textos →"}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Resultado */}
          {paso === 3 && (
            <div className="space-y-5">
              {analisis && (
                <div className="p-4" style={{ background: "var(--gold-soft)", border: "1px solid rgba(217,179,106,0.3)", borderRadius: 2 }}>
                  <p className="text-xs mb-1" style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Tu voz detectada
                  </p>
                  <p className="text-sm" style={{ color: "var(--bone)" }}>{analisis}</p>
                </div>
              )}
              <div className="space-y-3">
                {textos.map((t, i) => (
                  <div key={i} className="p-5" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Texto {i + 1}
                      </span>
                      <button id={`copy-btn-${i}`} onClick={() => copiar(t, i)}
                        className="text-xs px-2 py-1 transition-opacity hover:opacity-80"
                        style={{ background: "var(--gold-soft)", color: "var(--champagne)", border: "1px solid rgba(217,179,106,0.3)", borderRadius: 2 }}>
                        copiar
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--bone)" }}>{t}</p>
                  </div>
                ))}
              </div>

              {!enviado && (
                <div className="p-6" style={{ background: "var(--carbon)", border: "1px solid rgba(217,179,106,0.25)", borderRadius: 4 }}>
                  <p className="text-sm mb-3" style={{ color: "var(--bone)" }}>
                    📩 Te mando los 5 textos a tu email (formato editable + 3 ideas extra de tema para la próxima semana).
                  </p>
                  <form onSubmit={enviarEmail} className="space-y-2">
                    <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--obsidian)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                    <input type="email" required placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--obsidian)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                    <button type="submit" disabled={enviando}
                      className="w-full py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                      style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.9rem" }}>
                      {enviando ? "Enviando..." : "Recibir todo por email →"}
                    </button>
                  </form>
                </div>
              )}

              {enviado && (
                <div className="p-6 text-center" style={{ background: "var(--carbon)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 4 }}>
                  <p className="text-sm" style={{ color: "rgb(110,231,183)" }}>
                    ✓ Listo {nombre || ""}. Vas a recibir el resumen completo en {email}.
                  </p>
                </div>
              )}

              <button onClick={() => { setPaso(1); setTextos([]); setAnalisis(""); setEnviado(false); setEjemplos(["","",""]); setTema(""); setToken(""); }}
                className="text-xs underline" style={{ color: "var(--smoke)" }}>
                ← Empezar de nuevo
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
