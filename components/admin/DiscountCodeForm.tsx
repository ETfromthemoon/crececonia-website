"use client";

import { useState, type CSSProperties, type FormEvent } from "react";

type Props = {
  adminKey: string;
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "var(--carbon)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "10px 12px",
  color: "var(--bone)",
  fontSize: 14,
  fontFamily: "var(--font-mono)",
  boxSizing: "border-box",
};

const labelStyle: CSSProperties = {
  display: "block",
  color: "var(--smoke)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 6,
  fontFamily: "var(--font-mono)",
};

export default function DiscountCodeForm({ adminKey }: Props) {
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("20");
  const [quantity, setQuantity] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [noExpiration, setNoExpiration] = useState(false);
  const [maxUses, setMaxUses] = useState("1");
  const [unlimitedUses, setUnlimitedUses] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    setGenerated([]);

    const expiresAt = noExpiration
      ? null
      : new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000).toISOString();

    const res = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        type,
        amount: Number(amount),
        quantity: Number(quantity),
        expiresAt,
        maxUses: unlimitedUses ? null : Number(maxUses),
        prefix: prefix || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      setErrorMsg(data.error ?? "Error al generar los códigos.");
      setStatus("error");
      return;
    }

    setGenerated(data.codes ?? []);
    setStatus("idle");
  }

  function copyAll() {
    navigator.clipboard.writeText(generated.join("\n")).catch(() => {});
  }

  return (
    <div
      style={{
        background: "var(--carbon)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: 24,
        marginBottom: 40,
      }}
    >
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle} htmlFor="disc-type">Tipo</label>
            <select
              id="disc-type"
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
              style={inputStyle}
            >
              <option value="percent">% Porcentaje</option>
              <option value="fixed">$ Monto fijo CLP</option>
            </select>
          </div>

          <div>
            <label style={labelStyle} htmlFor="disc-amount">
              {type === "percent" ? "Porcentaje (1-100)" : "Monto CLP"}
            </label>
            <input
              id="disc-amount"
              type="number"
              min={1}
              max={type === "percent" ? 100 : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="disc-quantity">Cantidad de códigos</label>
            <input
              id="disc-quantity"
              type="number"
              min={1}
              max={200}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle} htmlFor="disc-expires">Vence en (días)</label>
            <input
              id="disc-expires"
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              style={{ ...inputStyle, opacity: noExpiration ? 0.4 : 1 }}
              disabled={noExpiration}
              required={!noExpiration}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                color: "var(--smoke)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={noExpiration}
                onChange={(e) => setNoExpiration(e.target.checked)}
              />
              Sin vencimiento
            </label>
          </div>

          <div>
            <label style={labelStyle} htmlFor="disc-max-uses">Usos por código</label>
            <input
              id="disc-max-uses"
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              style={{ ...inputStyle, opacity: unlimitedUses ? 0.4 : 1 }}
              disabled={unlimitedUses}
              required={!unlimitedUses}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                color: "var(--smoke)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={unlimitedUses}
                onChange={(e) => setUnlimitedUses(e.target.checked)}
              />
              Usos ilimitados
            </label>
          </div>

          <div>
            <label style={labelStyle} htmlFor="disc-prefix">Prefijo (opcional)</label>
            <input
              id="disc-prefix"
              type="text"
              placeholder="ej. BLACKFRIDAY"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {errorMsg && (
          <p style={{ color: "#e07a5f", fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary"
          style={{ cursor: status === "loading" ? "wait" : "pointer" }}
        >
          {status === "loading" ? "Generando..." : "Generar códigos"}
        </button>
      </form>

      {generated.length > 0 && (
        <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ color: "var(--champagne)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
              {generated.length} código{generated.length === 1 ? "" : "s"} generado
              {generated.length === 1 ? "" : "s"} — {unlimitedUses ? "usos ilimitados" : `${maxUses} uso${Number(maxUses) === 1 ? "" : "s"} cada uno`}
              {noExpiration ? ", sin vencimiento" : ""}
            </p>
            <button
              type="button"
              onClick={copyAll}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--bone)",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              Copiar todos
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 8,
            }}
          >
            {generated.map((code) => (
              <code
                key={code}
                style={{
                  background: "rgba(217,179,106,0.08)",
                  color: "var(--champagne)",
                  padding: "8px 10px",
                  borderRadius: 4,
                  fontSize: 13,
                  textAlign: "center",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {code}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
