"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "found" | "not-found" | "error";

const DownloadIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function DescargarPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(
        `/api/ebook/download?email=${encodeURIComponent(email)}&format=movil`
      );

      if (res.ok) {
        setVerifiedEmail(email);
        setStatus("found");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          data.error ??
            "No encontramos una compra con ese email. Verificá que sea el mismo email que usaste al comprar."
        );
        setStatus("not-found");
      }
    } catch {
      setErrorMsg("Error de conexión. Intenta nuevamente.");
      setStatus("error");
    }
  }

  return (
    <main className="pt-28">
      <section
        className="section-y-spacious px-6 flex items-center justify-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-10">
            <p className="eyebrow mb-4">Re-descarga</p>
            <h1
              className="font-light leading-tight mb-4"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--bone)",
                fontSize: "clamp(1.8rem, 3.5vw, 2.2rem)",
              }}
            >
              Recuperar descarga
            </h1>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.8 }}
            >
              Ingresá el email con el que compraste el ebook para acceder a tu descarga.
            </p>
          </div>

          <div
            style={{
              background: "var(--carbon)",
              border: "1px solid rgba(30,30,31,0.9)",
              borderRadius: 4,
              padding: "28px 24px",
            }}
          >
            {status === "found" ? (
              <div className="text-center">
                <p
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  COMPRA VERIFICADA
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--ash)", fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}
                >
                  Elegí el formato que querés descargar:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href={`/api/ebook/download?email=${encodeURIComponent(verifiedEmail)}&format=movil`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      background: "var(--champagne)",
                      color: "var(--obsidian)",
                      borderRadius: 2,
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      letterSpacing: "0.08em",
                      textDecoration: "none",
                    }}
                  >
                    <DownloadIcon />
                    Versión móvil (recomendada)
                  </a>
                  <a
                    href={`/api/ebook/download?email=${encodeURIComponent(verifiedEmail)}&format=a4`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "var(--ash)",
                      borderRadius: 2,
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.78rem",
                      letterSpacing: "0.08em",
                      textDecoration: "none",
                    }}
                  >
                    <DownloadIcon />
                    Versión A4 (para imprimir)
                  </a>
                </div>
                <button
                  onClick={() => { setStatus("idle"); setEmail(""); setVerifiedEmail(""); }}
                  style={{
                    color: "var(--smoke)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: 20,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  ← Intentar con otro email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="recover-email"
                  style={{
                    display: "block",
                    color: "var(--ash)",
                    fontSize: "0.78rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  Tu email
                </label>
                <input
                  id="recover-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  disabled={status === "loading"}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(30,30,31,0.9)",
                    borderRadius: 2,
                    padding: "12px 14px",
                    color: "var(--bone)",
                    fontSize: "0.95rem",
                    outline: "none",
                    marginBottom: 12,
                    boxSizing: "border-box",
                    fontFamily: "var(--font-sans)",
                  }}
                />

                {(status === "not-found" || status === "error") && (
                  <p
                    style={{
                      color: "rgba(217,106,106,0.9)",
                      fontSize: "0.8rem",
                      marginBottom: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-evaluacion"
                  style={{
                    width: "100%",
                    cursor: status === "loading" ? "wait" : "pointer",
                    opacity: status === "loading" ? 0.7 : 1,
                    border: "none",
                  }}
                >
                  {status === "loading" ? "Buscando..." : "Recuperar descarga"}
                </button>
              </form>
            )}
          </div>

          <p
            className="text-sm text-center mt-8"
            style={{ color: "var(--smoke)", fontWeight: 300, lineHeight: 1.7 }}
          >
            ¿Problemas con la descarga? Escribinos a{" "}
            <a
              href="mailto:sergio@crececonia.cl"
              style={{ color: "var(--champagne)", textDecoration: "none" }}
            >
              sergio@crececonia.cl
            </a>
          </p>

          <div className="text-center mt-6">
            <Link
              href="/ebook/de-cero-a-claude-en-una-semana"
              className="text-sm"
              style={{
                color: "var(--smoke)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              ← Volver al ebook
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
