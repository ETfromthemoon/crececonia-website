"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "sent" | "error";

/**
 * Recuperación de descarga por email, para CUALQUIER libro del catálogo.
 *
 * Antes esta página asumía el libro 1: pedía el email y linkeaba directo a
 * /api/ebook/download sin `resource`, que por defecto entrega el libro 1. Un
 * comprador de otro libro recibía el PDF equivocado (y gratis uno que no
 * compró), y un comprador de combo recibía "no encontramos tu compra".
 *
 * Ahora envía enlaces nuevos al mismo email. El navegador no lista compras
 * ni usa una dirección como credencial de descarga.
 */
export default function EbookRecuperarDescarga() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ebook/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error ?? "No se pudo verificar la compra. Intenta nuevamente.");
        setStatus("error");
        return;
      }

      setStatus("sent");
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
              Ingresá el email con el que compraste para acceder a tus descargas.
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
            {status === "sent" ? (
              <div>
                <p
                  style={{
                    color: "var(--champagne)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8rem",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  EMAIL ENVIADO
                </p>
                <p
                  className="text-sm"
                  style={{
                    color: "var(--ash)",
                    fontWeight: 300,
                    lineHeight: 1.7,
                    marginBottom: 24,
                    textAlign: "center",
                  }}
                >
                  Si existe una compra asociada a este email, vas a recibir enlaces nuevos en unos minutos.
                </p>
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                    }}
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

                {status === "error" && (
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
              href="/ebooks"
              className="text-sm"
              style={{
                color: "var(--smoke)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              ← Ver todos los ebooks
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
