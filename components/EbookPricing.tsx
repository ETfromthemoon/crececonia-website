"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";

const TIER_LABELS: Record<string, { badge: string; discount: string; color: string }> = {
  "super-early": {
    badge: "Super Early",
    discount: "60% OFF",
    color: "rgba(217,179,106,1)",
  },
  early: {
    badge: "Early Adopters",
    discount: "33% OFF",
    color: "rgba(217,179,106,0.75)",
  },
  regular: { badge: "", discount: "", color: "" },
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
    <section
      id="comprar"
      className="section-y px-6"
      style={{ background: "var(--graphite)" }}
    >
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <p className="eyebrow mb-4">Precio</p>
          <h2
            className="font-light leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--bone)" }}
          >
            Empezá hoy.{" "}
            <em className="gradient-text">Sin excusas.</em>
          </h2>
        </div>

        <div
          style={{
            background: "var(--carbon)",
            border: "1px solid rgba(30,30,31,0.9)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* Price header */}
          <div
            style={{
              padding: "28px 28px 24px",
              borderBottom: "1px solid rgba(30,30,31,0.9)",
            }}
          >
            {hasDiscount && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    background: "rgba(217,179,106,0.1)",
                    border: `1px solid ${tierInfo.color}`,
                    color: tierInfo.color,
                    padding: "2px 8px",
                    borderRadius: 2,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {tierInfo.badge}
                </span>
                <span
                  style={{
                    background: "rgba(217,179,106,0.15)",
                    color: "var(--champagne)",
                    padding: "2px 8px",
                    borderRadius: 2,
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                  }}
                >
                  {tierInfo.discount}
                </span>
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
              }}
            >
              <span
                style={{
                  color: "var(--bone)",
                  fontSize: "2.2rem",
                  fontWeight: 300,
                  fontFamily: "var(--font-mono)",
                }}
              >
                ${formattedPrice}
              </span>
              <span
                style={{
                  color: "var(--smoke)",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                CLP
              </span>
              {hasDiscount && (
                <span
                  style={{
                    color: "var(--smoke)",
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
                  color: priceInfo.remaining <= 3 ? "rgba(217,179,106,0.9)" : "var(--smoke)",
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  marginTop: 8,
                }}
              >
                {priceInfo.remaining <= 3
                  ? `¡Solo quedan ${priceInfo.remaining}!`
                  : `Quedan ${priceInfo.remaining} cupos a este precio`}
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
            <label
              htmlFor="ebook-email"
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
              id="ebook-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(30,30,31,0.9)",
                borderRadius: 2,
                padding: "12px 14px",
                color: "var(--bone)",
                fontSize: "0.95rem",
                outline: "none",
                marginBottom: 14,
                boxSizing: "border-box",
                fontFamily: "var(--font-sans)",
              }}
            />

            {errorMsg && (
              <p
                style={{
                  color: "rgba(217,106,106,0.9)",
                  fontSize: "0.8rem",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-evaluacion btn-lg"
              style={{
                width: "100%",
                cursor: status === "loading" ? "wait" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
                border: "none",
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
              padding: "0 28px 24px",
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
                  color: "var(--smoke)",
                  fontSize: "0.78rem",
                  fontWeight: 300,
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
