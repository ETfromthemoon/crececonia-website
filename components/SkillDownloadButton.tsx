"use client";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function SkillDownloadButton({
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
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function descargar() {
    setError("");
    setEnviando(true);
    trackEvent("skill_download_requested", { slug, file_type: archivoTipo });
    try {
      const r = await fetch(`/api/public/skills/${slug}/request-download`, {
        method: "POST",
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.detail || "Error");
        return;
      }
      window.location.href = d.download_url;
    } catch {
      setError("Error de red");
      trackEvent("skill_download_failed", { slug, reason: "network" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        onClick={descargar}
        disabled={enviando}
        className="inline-flex items-center gap-2 py-3 px-6 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{
          background: "var(--champagne)",
          color: "var(--obsidian)",
          borderRadius: 2,
          fontSize: "0.95rem",
        }}
      >
        <span>↓</span>
        <span>{enviando ? "Preparando descarga..." : `Descargar ${archivoNombre}`}</span>
      </button>
      <span
        className="text-xs ml-3"
        style={{ color: "var(--smoke)", fontFamily: "var(--font-mono)" }}
      >
        {(archivoSize / 1024).toFixed(1)} KB · {archivoTipo?.toUpperCase()}
      </span>

      {error && <p role="alert" className="text-xs mt-2" style={{ color: "rgb(248,113,113)" }}>{error}</p>}
    </>
  );
}
