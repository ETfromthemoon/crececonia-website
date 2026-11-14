"use client";

import { useState, type FormEvent } from "react";

export default function MarketplaceSandboxCheckout({
  bookId, priceMinor,
}: {
  bookId: string;
  priceMinor: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const expectedAmount = Number(priceMinor);
  const validAmount = Number.isSafeInteger(expectedAmount) && expectedAmount > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validAmount || busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/marketplace/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId, email, expectedAmount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "No se pudo iniciar la compra.");
      const destination = new URL(data.redirectUrl);
      if (destination.protocol !== "https:" || !/(^|\.)flow\.cl$/.test(destination.hostname)) {
        throw new Error("La dirección de pago no es válida.");
      }
      window.location.assign(destination.href);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo iniciar la compra.");
      setBusy(false);
    }
  }

  if (!validAmount) return <p>La compra no está disponible para este precio. Escríbenos para recibir ayuda.</p>;
  return <form onSubmit={submit} style={{ maxWidth: 480, display: "grid", gap: 14 }}>
    <p className="eyebrow">Piloto de pago de prueba</p>
    <label htmlFor="marketplace-buyer-email">Correo para recibir el libro</label>
    <input id="marketplace-buyer-email" type="email" required maxLength={320} autoComplete="email"
      value={email} onChange={(event) => setEmail(event.target.value)}
      style={{ padding: 14, borderRadius: 8, color: "#111" }} />
    <button type="submit" disabled={busy}>{busy ? "Preparando pago…" : "Continuar a pago de prueba"}</button>
    {error && <p role="alert">{error}</p>}
  </form>;
}
