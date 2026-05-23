"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = "https://autodrive.cl";

export default function CalculadoraPage() {
  const [proceso, setProceso] = useState("");
  const [horas, setHoras] = useState<number>(10);
  const [costo, setCosto] = useState<number>(15);
  const [pct, setPct] = useState<number>(70);

  const [resultado, setResultado] = useState<{
    token: string;
    ahorro_mensual_usd: number;
    ahorro_anual_usd: number;
    horas_ahorradas_mes: number;
  } | null>(null);

  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";

  async function calcular(e: React.FormEvent) {
    e.preventDefault();
    if (!proceso.trim() || horas <= 0 || costo <= 0) return;
    const r = await fetch(`${API_BASE}/api/public/roi-calc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proceso,
        horas_semana: horas,
        costo_hora_usd: costo,
        porcentaje_automatizable: pct,
        ref_code: refCode,
      }),
    });
    if (r.ok) setResultado(await r.json());
  }

  async function enviarEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@") || !resultado) return;
    setEnviando(true);
    const r = await fetch(`${API_BASE}/api/public/roi-calc/${resultado.token}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nombre, empresa }),
    });
    setEnviando(false);
    if (r.ok) setEnviado(true);
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-32" style={{ background: "var(--obsidian)", paddingTop: 128 }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs mb-5" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Calculadora gratuita
          </p>
          <h1 className="font-light mb-6 leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 3.6rem)", color: "var(--bone)" }}>
            ¿Cuánto te ahorrarías automatizando un proceso con IA?
          </h1>
          <p className="leading-relaxed mb-12" style={{ color: "var(--ash)", fontSize: "clamp(1.05rem, 2vw, 1.25rem)", lineHeight: 1.6, fontWeight: 300 }}>
            Calculo basado en horas reales del equipo. Sin cuento. 30 segundos.
          </p>

          {/* Form de cálculo */}
          {!resultado && (
            <form onSubmit={calcular} className="space-y-5">
              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  1. ¿Qué proceso querés evaluar?
                </label>
                <input
                  type="text" required value={proceso} onChange={(e) => setProceso(e.target.value)}
                  placeholder="Ej: responder cotizaciones, agendar reuniones, atender consultas..."
                  className="w-full px-4 py-3 text-sm outline-none transition-colors"
                  style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    2. Horas / semana
                  </label>
                  <input
                    type="number" required min={1} max={200} value={horas} onChange={(e) => setHoras(Number(e.target.value))}
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)", fontFamily: "var(--font-mono)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    3. Costo / hora del equipo (USD)
                  </label>
                  <input
                    type="number" required min={1} max={500} value={costo} onChange={(e) => setCosto(Number(e.target.value))}
                    className="w-full px-4 py-3 text-sm outline-none"
                    style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)", fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  4. % automatizable estimado: {pct}%
                </label>
                <input
                  type="range" min={20} max={95} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: "var(--champagne)" }}
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  <span>20%</span><span>50%</span><span>95%</span>
                </div>
              </div>

              <button type="submit" className="w-full py-3 font-medium transition-opacity hover:opacity-90"
                style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.95rem" }}>
                Calcular ahorro
              </button>
            </form>
          )}

          {/* Resultado */}
          {resultado && (
            <div className="space-y-6">
              <div className="p-8 text-center" style={{ background: "var(--carbon)", border: "1px solid rgba(217,179,106,0.25)", borderRadius: 4 }}>
                <p className="text-xs mb-3" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Ahorro mensual estimado
                </p>
                <p className="font-light" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.6rem, 12vw, 5rem)", color: "var(--champagne)", lineHeight: 1 }}>
                  USD {resultado.ahorro_mensual_usd.toLocaleString()}
                </p>
                <p className="mt-3 text-sm" style={{ color: "var(--ash)" }}>
                  ≈ USD {resultado.ahorro_anual_usd.toLocaleString()} al año
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}>
                  Aproximadamente {resultado.horas_ahorradas_mes} horas/mes liberadas del equipo
                </p>
              </div>

              {!emailMode && !enviado && (
                <div className="text-center">
                  <button onClick={() => setEmailMode(true)}
                    className="py-3 px-6 font-medium transition-opacity hover:opacity-90"
                    style={{ background: "var(--gold-soft)", color: "var(--champagne)", border: "1px solid rgba(217,179,106,0.3)", borderRadius: 2, fontSize: "0.9rem" }}>
                    Recibir reporte detallado en PDF →
                  </button>
                  <p className="mt-3 text-xs" style={{ color: "var(--smoke)" }}>
                    Incluye benchmarks, métricas reales y siguiente paso recomendado para tu caso.
                  </p>
                </div>
              )}

              {emailMode && !enviado && (
                <form onSubmit={enviarEmail} className="space-y-3 p-6" style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 4 }}>
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
                    {enviando ? "Enviando..." : "Enviarme el reporte"}
                  </button>
                </form>
              )}

              {enviado && (
                <div className="p-6 text-center" style={{ background: "var(--carbon)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 4 }}>
                  <p className="text-sm" style={{ color: "rgb(110,231,183)" }}>
                    ✓ Reporte enviado a {email}. Revisá tu inbox en 2 min.
                  </p>
                </div>
              )}

              <button onClick={() => { setResultado(null); setEmailMode(false); setEnviado(false); }}
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
