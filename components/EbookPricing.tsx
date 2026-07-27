"use client";

import { useEffect, useState } from "react";
import type { PriceInfo } from "@/lib/ebook-pricing";
import EbookSectionHeading from "./EbookSectionHeading";
import EbookSoldCounter from "./EbookSoldCounter";
import styles from "./EbookCinematic.module.css";

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

type AppliedDiscount = { code: string; finalPrice: number };

export default function EbookPricing() {
  const [priceInfo, setPriceInfo] = useState<PriceInfo | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [discountInput, setDiscountInput] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  async function handleApplyDiscount() {
    if (!discountInput) return;
    setApplyingDiscount(true);
    setDiscountError("");

    const res = await fetch("/api/ebook/discount/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountInput }),
    });
    const data = await res.json().catch(() => ({}));
    setApplyingDiscount(false);

    if (!data.valid) {
      setDiscountError(data.reason ?? "Código no válido.");
      setAppliedDiscount(null);
      return;
    }

    setAppliedDiscount({ code: data.code, finalPrice: data.finalPrice });
  }

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
      body: JSON.stringify({ email, discountCode: appliedDiscount?.code }),
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
  const basePrice = priceInfo?.price ?? 27000;
  const displayPrice = appliedDiscount?.finalPrice ?? basePrice;
  const formattedPrice = displayPrice.toLocaleString("es-CL");
  const formattedBasePrice = basePrice.toLocaleString("es-CL");
  const formattedOriginal = (27000).toLocaleString("es-CL");
  const hasDiscount = tier !== "regular";

  return (
    <section id="comprar" className="section-y px-6">
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <EbookSectionHeading kicker="Precio">
          Empezá hoy.{" "}
          <em style={{ fontStyle: "italic" }}>Sin excusas.</em>
        </EbookSectionHeading>

        <div
          className={`${styles.glass} ${styles.glassSheen}`}
          style={{ borderRadius: 40, overflow: "hidden" }}
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
              {(hasDiscount || appliedDiscount) && (
                <span
                  style={{
                    color: "#4e4d4d",
                    fontSize: "0.9rem",
                    textDecoration: "line-through",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ${appliedDiscount ? formattedBasePrice : formattedOriginal}
                </span>
              )}
            </div>

            {appliedDiscount && (
              <p
                style={{
                  color: "#2e7d32",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  marginTop: 6,
                }}
              >
                Código {appliedDiscount.code} aplicado ✓
              </p>
            )}

            <div style={{ marginTop: 8 }}>
              <EbookSoldCounter color="#4e4d4d" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "28px 36px" }}>
            {!appliedDiscount && (
              <div style={{ marginBottom: 18 }}>
                <label
                  htmlFor="ebook-discount"
                  style={{
                    display: "block",
                    color: "#4e4d4d",
                    fontSize: "0.75rem",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  ¿Tenés un código de descuento?
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    id="ebook-discount"
                    type="text"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value);
                      setDiscountError("");
                    }}
                    placeholder="CODIGO2025"
                    style={{
                      flex: 1,
                      background: "#f6f3f1",
                      border: "1px solid rgba(0,0,0,0.2)",
                      borderRadius: 12,
                      padding: "11px 14px",
                      color: "#000",
                      fontSize: "0.85rem",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount || !discountInput}
                    style={{
                      cursor: applyingDiscount ? "wait" : "pointer",
                      background: "transparent",
                      border: "1px solid rgba(0,0,0,0.25)",
                      borderRadius: 12,
                      padding: "0 18px",
                      color: "#242424",
                      fontSize: "0.8rem",
                      fontFamily: "var(--font-mono)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {applyingDiscount ? "..." : "Aplicar"}
                  </button>
                </div>
                {discountError && (
                  <p
                    style={{
                      color: "#c0392b",
                      fontSize: "0.75rem",
                      marginTop: 6,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {discountError}
                  </p>
                )}
              </div>
            )}

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
