"use client";

import { useEffect, useMemo, useState } from "react";

type Offer = {
  id: string;
  offerKey: string;
  label: string;
  amount: number;
  totalCupos: number;
  soldCupos: number;
  reservedCupos: number;
  remaining: number;
};

function formatPrice(amount: number) {
  return `$${amount.toLocaleString("es-CL")}`;
}

export default function ClassCheckout() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferKey, setSelectedOfferKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function loadOffers() {
    const response = await fetch("/api/clase/availability", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.offers)) throw new Error("availability");
    setOffers(data.offers);
    setSelectedOfferKey((current) => {
      if (current && data.offers.some((offer: Offer) => offer.offerKey === current && offer.remaining > 0)) return current;
      return data.offers.find((offer: Offer) => offer.remaining > 0)?.offerKey ?? "";
    });
  }

  useEffect(() => {
    loadOffers().catch(() => setError("No pudimos cargar los cupos. Recarga la página e intenta nuevamente."));
    const interval = window.setInterval(() => loadOffers().catch(() => undefined), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.offerKey === selectedOfferKey),
    [offers, selectedOfferKey]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOffer || !email) return;
    setStatus("loading");
    setError("");
    const response = await fetch("/api/clase/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, offerKey: selectedOffer.offerKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      setStatus("error");
      setError(data.error ?? "No pudimos iniciar el pago. Actualiza los cupos e intenta nuevamente.");
      await loadOffers().catch(() => undefined);
      return;
    }
    window.location.href = data.redirectUrl;
  }

  return (
    <section id="reservar" className="class-checkout site-container">
      <div className="class-checkout-heading">
        <span className="eyebrow">Reserva tu lugar</span>
        <h2>El precio cambia cuando se agota cada tramo.</h2>
        <p>Selecciona un cupo disponible y continúa al pago seguro de Flow.</p>
      </div>
      <div className="class-offer-grid">
        {offers.map((offer) => {
          const soldOut = offer.remaining <= 0;
          const selected = offer.offerKey === selectedOfferKey;
          return (
            <button
              key={offer.offerKey}
              type="button"
              className={`class-offer ${selected ? "is-selected" : ""} ${soldOut ? "is-sold-out" : ""}`}
              disabled={soldOut || status === "loading"}
              onClick={() => setSelectedOfferKey(offer.offerKey)}
              aria-pressed={selected}
            >
              <span>{offer.label}</span>
              <strong>{formatPrice(offer.amount)}</strong>
              <small>{soldOut ? "Agotado" : `${offer.remaining} de ${offer.totalCupos} disponibles`}</small>
            </button>
          );
        })}
      </div>
      <form className="class-checkout-form" onSubmit={handleSubmit}>
        <label htmlFor="class-email">Correo donde recibirás la confirmación</label>
        <div className="class-checkout-row">
          <input
            id="class-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
          />
          <button className="button button-dark" type="submit" disabled={!selectedOffer || status === "loading"}>
            {status === "loading" ? "Preparando…" : `Pagar ${selectedOffer ? formatPrice(selectedOffer.amount) : ""}`} <span>→</span>
          </button>
        </div>
        <p className="class-checkout-note">Tu cupo se reserva durante 30 minutos mientras completas el pago.</p>
        {error && <p className="class-checkout-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
