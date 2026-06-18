"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";

const TIER_LABELS: Record<string, { badge: string; discount: string }> = {
  "super-early": { badge: "Super Early", discount: "60% OFF" },
  early: { badge: "Early Adopters", discount: "33% OFF" },
  regular: { badge: "", discount: "" },
};

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function EbookPricing() {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = () =>
      fetch("/api/ebook/cupos")
        .then((r) => r.json())
        .then(setPriceInfo)
        .catch(() => {});

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/flow/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      setErrorMsg(data.error ?? "Error al procesar el pago. Intentá nuevamente.");
      setStatus("error");
      return;
    }

    window.location.href = data.redirectUrl;
  }

  const tier = priceInfo?.tier ?? "regular";
  const tierInfo = TIER_LABELS[tier] ?? TIER_LABELS.regular;
  const formattedPrice = priceInfo?.price
    ? priceInfo.price.toLocaleString("es-CL")
    : "27.000";
  const formattedOriginal = (27000).toLocaleString("es-CL");
  const hasDiscount = tier !== "regular";

  return (
    <section id="comprar" className="section-y px-6">
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#4e4d4d",
              marginBottom: 16,
            }}
          >
            Precio
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif-monad), Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#000",
            }}
          >
            Empezá hoy.{" "}
            <em style={{ fontStyle: "italic" }}>Sin excusas.</em>
          </h2>
        </div>

        <div
          style={{
            background: "#cfdaf5",
            borderRadius: 40,
            overflow: "hidden",
            boxShadow: "rgba(0,0,0,0.1) 0px 0px 10px 0px",
          }}
        >
          {/* Price header */}
          <div
            style={{
              padding: "36px 36px 28px",
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            {hasDiscount && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span
                  style={{
                    background: "#242424",
                    color: "#f6f3f1",
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                  }}
                >
                  {tierInfo.badge}
                </span>
                <span
                  style={{
                    background: "rgba(0,0,0,0.08)",
                    color: "#242424",
                    padding: "3px 10px",
                    borderRadius: 100,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tierInfo.discount}
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span
                style={{
                  color: "#000",
                  fontSize: "2.4rem",
                  fontWeight: 400,
                  fontFamily: "var(--font-serif-monad), Georgia, serif",
                }}
              >
                ${formattedPrice}
              </span>
              <span
                style={{
                  color: "#4e4d4d",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                CLP
              </span>
              {hasDiscount && (
                <span
                  style={{
                    color: "#4e4d4d",
                    fontSize: "0.9rem",
                    textDecoration: "line-through",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ${formattedOriginal}
                </span>
              )}
            </div>

            {priceInfo?.remaining !== null && priceInfo?.remaining !== undefined && (
              <p
                style={{
                  color: priceInfo.remaining <= 3 ? "#242424" : "#4e4d4d",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em",
                  marginTop: 8,
                  fontWeight: priceInfo.remaining <= 3 ? 500 : 400,
                }}
              >
                {priceInfo.remaining <= 3
                  ? `¡Solo quedan ${priceInfo.remaining}!`
                  : `Quedan ${priceInfo.remaining} cupos a este precio`}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "28px 36px" }}>
            <label
              htmlFor="ebook-email"
              style={{
                display: "block",
                color: "#4e4d4d",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              Tu email
            </label>
            <input
              id="ebook-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                background: "#f6f3f1",
                border: "1px solid rgba(0,0,0,0.2)",
                borderRadius: 12,
                padding: "13px 16px",
                color: "#000",
                fontSize: "0.95rem",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
                fontFamily: "var(--font-mono)",
              }}
            />

            {errorMsg && (
              <p
                style={{
                  color: "#c0392b",
                  fontSize: "0.8rem",
                  marginBottom: 12,
                  lineHeight: 1.5,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-monad-fill"
              style={{
                width: "100%",
                cursor: status === "loading" ? "wait" : "pointer",
              }}
            >
              {status === "loading"
                ? "Redirigiendo a pago..."
                : `Comprar ahora · $${formattedPrice} CLP`}
            </button>
          </form>

          {/* Trust signals */}
          <div
            style={{
              padding: "0 36px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {[
              "Pago seguro via Flow (Webpay, débito, crédito)",
              "Descarga inmediata al completar el pago",
              "Garantía de devolución si no te sirve",
            ].map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#4e4d4d",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <CheckIcon />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
