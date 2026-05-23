"use client";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = "https://autodrive.cl";

export default function HorasPerdidasPage() {
  const [proceso, setProceso] = useState("");
  const [horas, setHoras] = useState<number>(10);
  const [personas, setPersonas] = useState<number>(2);
  const [costo, setCosto] = useState<number>(15);

  const [calculado, setCalculado] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [emailMode, setEmailMode] = useState(false);

  // Cálculos client-side
  const horasEquipoMes = useMemo(() => horas * personas * 4.33, [horas, personas]);
  const costoMensual = useMemo(() => horasEquipoMes * costo, [horasEquipoMes, costo]);
  const costoAnual = useMemo(() => costoMensual * 12, [costoMensual]);

  // Comparativos visuales (Chile referencias)
  const comparativos = useMemo(() => ({
    cafesPorDia: Math.round(costoMensual / 4 / 30),
    sueldoJuniorEquivalente: (costoMensual / 800).toFixed(1),
    viajesEuropaAnual: Math.floor(costoAnual / 1500),
    autoNuevoAnual: (costoAnual / 18000).toFixed(1),
  }), [costoMensual, costoAnual]);

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    if (!proceso.trim() || horas <= 0 || costo <= 0 || personas <= 0) return;
    // Guardamos el cálculo en el backend (registra el evento)
    const r = await fetch(`${API_BASE}/api/public/roi-calc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proceso: `[Horas perdidas] ${proceso} (${personas} personas)`,
        horas_semana: horas * personas,  // horas totales del equipo
        costo_hora_usd: costo,
        porcentaje_automatizable: 70,  // valor por defecto
        ref_code: refCode,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      setToken(d.token);
      setCalculado(true);
    }
  }

  async function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@") || !token) return;
    setEnviando(true);
    const r = await fetch(`${API_BASE}/api/public/roi-calc/${token}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre, empresa }),
    });
    setEnviando(false);
    if (r.ok) setEnviado(true);
  }

  function shareText() {
    const txt = `Acabo de calcular cuánto dinero pierde mi equipo en un proceso manual: USD ${costoMensual.toFixed(0)} al mes 😱\n\nProbalo con tu caso → https://crececonia.cl/horas-perdidas`;
    if (navigator.share) {
      navigator.share({ text: txt, url: "https://crececonia.cl/horas-perdidas" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(txt).then(() => alert("Texto copiado para compartir"));
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 128 }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs mb-5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Calculadora gratuita · 2 minutos
          </p>
          <h1 className="font-light mb-6 leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 3.6rem)", color: "var(--bone)" }}>
            ¿Cuánto te roba ese proceso manual?
          </h1>
          <p className="leading-relaxed mb-16" style={{ color: "var(--ash)", fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.6, fontWeight: 300 }}>
            En 30 segundos sabés cuánto dinero pierde tu equipo cada mes en una tarea repetitiva. Sin teoría, números reales.
          </p>

          {/* Form */}
          {!calculado && (
            <form onSubmit={calcular} className="space-y-8">
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  1. ¿Qué proceso evaluamos?
                </label>
                <input type="text" required value={proceso} onChange={(e) => setProceso(e.target.value)}
                  placeholder="Ej: responder cotizaciones, agendar reuniones, atender consultas..."
                  className="w-full px-4 py-3 text-sm outline-none"
                  style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  2. ¿Cuántas horas / semana le dedica una persona?  <span style={{ color: "var(--champagne)" }}>{horas} h</span>
                </label>
                <input type="range" min={1} max={40} step={1} value={horas} onChange={(e) => setHoras(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "var(--champagne)" }} />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  <span>1h</span><span>20h</span><span>40h</span>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  3. ¿Cuántas personas hacen este proceso?  <span style={{ color: "var(--champagne)" }}>{personas} persona{personas !== 1 ? "s" : ""}</span>
                </label>
                <input type="range" min={1} max={20} step={1} value={personas} onChange={(e) => setPersonas(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "var(--champagne)" }} />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  <span>1</span><span>10</span><span>20</span>
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  4. Costo / hora del equipo (USD)  <span style={{ color: "var(--champagne)" }}>USD {costo}</span>
                </label>
                <input type="range" min={5} max={80} step={1} value={costo} onChange={(e) => setCosto(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "var(--champagne)" }} />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  <span>5</span><span>40</span><span>80</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "var(--smoke)" }}>
                  Tip: sumá sueldo + leyes sociales y dividí por 160 h/mes
                </p>
              </div>

              <button type="submit" className="w-full py-3 font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.95rem" }}>
                Ver cuánto cuesta →
              </button>
            </form>
          )}

          {/* Resultado */}
          {calculado && (
            <div className="space-y-6">
              <div className="p-8 text-center" style={{ background: "var(--carbon)", border: "1px solid rgba(217,179,106,0.25)", borderRadius: 4 }}>
                <p className="text-xs mb-3" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Tu equipo pierde
                </p>
                <p className="font-light" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 12vw, 5rem)", color: "var(--champagne)", lineHeight: 1 }}>
                  USD {costoMensual.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--bone)", fontWeight: 300 }}>al mes</p>
                <p className="mt-1 text-xs" style={{ color: "var(--smoke)" }}>
                  Eso es USD {costoAnual.toLocaleString("es-CL", { maximumFractionDigits: 0 })} al año · {horasEquipoMes.toFixed(0)} h/mes del equipo
                </p>
              </div>

              {/* Comparativos visuales (lo viral) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                  <p className="text-xs mb-1" style={{ color: "var(--smoke)" }}>Equivalente mensual</p>
                  <p className="text-lg" style={{ color: "var(--bone)" }}>☕ <strong>{comparativos.cafesPorDia} cafés</strong> por día</p>
                </div>
                <div className="p-4" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                  <p className="text-xs mb-1" style={{ color: "var(--smoke)" }}>Sueldo equivalente</p>
                  <p className="text-lg" style={{ color: "var(--bone)" }}>👤 <strong>{comparativos.sueldoJuniorEquivalente}</strong> juniors part-time</p>
                </div>
                <div className="p-4" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                  <p className="text-xs mb-1" style={{ color: "var(--smoke)" }}>Al año</p>
                  <p className="text-lg" style={{ color: "var(--bone)" }}>✈️ <strong>{comparativos.viajesEuropaAnual}</strong> viajes a Europa</p>
                </div>
                <div className="p-4" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                  <p className="text-xs mb-1" style={{ color: "var(--smoke)" }}>Al año</p>
                  <p className="text-lg" style={{ color: "var(--bone)" }}>🚗 <strong>{comparativos.autoNuevoAnual}</strong> autos nuevos</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid sm:grid-cols-2 gap-3">
                {!emailMode && !enviado && (
                  <button onClick={() => setEmailMode(true)}
                    className="py-3 px-5 font-medium transition-opacity hover:opacity-90"
                    style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.9rem" }}>
                    Recibir cómo resolverlo →
                  </button>
                )}
                <button onClick={shareText}
                  className="py-3 px-5 transition-opacity hover:opacity-80"
                  style={{ background: "var(--gold-soft)", color: "var(--champagne)", border: "1px solid rgba(217,179,106,0.3)", borderRadius: 2, fontSize: "0.9rem" }}>
                  📤 Compartir el resultado
                </button>
              </div>

              {emailMode && !enviado && (
                <form onSubmit={enviarEmail} className="space-y-3 p-6" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
                  <p className="text-sm mb-3" style={{ color: "var(--bone)" }}>
                    Te mando un análisis personalizado en PDF + las <strong>3 formas concretas</strong> de resolverlo con IA.
                  </p>
                  <input type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--obsidian)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                  <input type="text" placeholder="Empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--obsidian)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                  <input type="email" required placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--obsidian)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }} />
                  <button type="submit" disabled={enviando}
                    className="w-full py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.9rem" }}>
                    {enviando ? "Enviando..." : "Enviarme el análisis →"}
                  </button>
                </form>
              )}

              {enviado && (
                <div className="p-6 text-center" style={{ background: "var(--carbon)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 4 }}>
                  <p className="text-sm" style={{ color: "rgb(110,231,183)" }}>
                    ✓ Análisis enviado a {email}. Revisá tu inbox en 2 min.
                  </p>
                </div>
              )}

              <button onClick={() => { setCalculado(false); setEmailMode(false); setEnviado(false); }}
                className="text-xs underline" style={{ color: "var(--smoke)" }}>
                ← Calcular otro proceso
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
