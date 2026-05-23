"use client";
import { useState } from "react";

const API_BASE = "https://autodrive.cl";

export default function SkillDownloadGate({
  slug,
  archivoNombre,
  archivoSize,
  archivoTipo,
}: {
  slug: string;
  archivoNombre: string;
  archivoSize: number;
  archivoTipo: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const refCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") || ""
    : "";

  async function descargar(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Email inválido");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const r = await fetch(`${API_BASE}/api/public/skills/${slug}/request-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, ref_code: refCode }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.detail || "Error");
        return;
      }
      // Disparar descarga real
      window.location.href = `${API_BASE}${d.download_url}`;
      // Cerrar modal después de un breve delay
      setTimeout(() => setOpen(false), 500);
    } catch {
      setError("Error de red");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 py-3 px-6 font-medium transition-opacity hover:opacity-90"
        style={{
          background: "var(--champagne)",
          color: "var(--obsidian)",
          borderRadius: 2,
          fontSize: "0.95rem",
        }}
      >
        <span>↓</span>
        <span>Descargar {archivoNombre}</span>
      </button>
      <span
        className="text-xs ml-3"
        style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}
      >
        {(archivoSize / 1024).toFixed(1)} KB · {archivoTipo?.toUpperCase()}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md p-5 sm:p-7" style={{ background: "var(--obsidian)", border: "1px solid rgba(217,179,106,0.25)", borderRadius: 4 }}>
            <p className="text-xs mb-2" style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Descarga gratuita
            </p>
            <h3 className="font-light mb-1" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--bone)" }}>
              Una cosa antes
            </h3>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--ash)" }}>
              Te mando este archivo + las próximas skills que publique. Sin spam, podés salir cuando quieras.
            </p>

            <form onSubmit={descargar} className="space-y-3">
              <input
                type="text" placeholder="Tu nombre (opcional)" value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }}
              />
              <input
                type="email" required placeholder="Email *" value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: "var(--carbon)", border: "1px solid rgba(30,30,31,0.9)", borderRadius: 2, color: "var(--bone)" }}
              />
              {error && <p className="text-xs" style={{ color: "rgb(248,113,113)" }}>{error}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={enviando}
                  className="flex-1 py-2.5 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--champagne)", color: "var(--obsidian)", borderRadius: 2, fontSize: "0.9rem" }}>
                  {enviando ? "Procesando..." : "Descargar →"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-5 text-sm" style={{ color: "var(--smoke)" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
