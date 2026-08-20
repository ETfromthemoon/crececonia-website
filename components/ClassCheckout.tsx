"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { CLASS_PRODUCT_KEY } from "@/lib/class-product";

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

  useEffect(() => {
    const checkout = document.getElementById("reservar");
    if (!checkout) return;

    let tracked = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || tracked) return;
        tracked = true;
        trackEvent("class_reservation_viewed", { product: CLASS_PRODUCT_KEY });
        observer.disconnect();
      },
      { threshold: 0.45 }
    );

    observer.observe(checkout);
    return () => observer.disconnect();
  }, []);

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

  const currentOffer = useMemo(
    () => offers.find((offer) => offer.remaining > 0),
    [offers]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOffer || !email) return;
    setStatus("loading");
    setError("");
    trackEvent("class_checkout_started", {
      product: CLASS_PRODUCT_KEY,
      offer_key: selectedOffer.offerKey,
      amount: selectedOffer.amount,
    });
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
      <div className="class-checkout-waves" aria-hidden="true"><span /><span /><span /></div>
      <div className="class-checkout-layout">
        <div className="class-checkout-heading">
          <span className="eyebrow">Tu acceso empieza aquí</span>
          <h2>Reserva el precio activo. <em>Después construimos.</em></h2>
          <p>Deja tu correo, completa el pago y llega a la clase con tu lugar, guía, skills y pack de libros asegurados.</p>
          <div className="class-checkout-proof" aria-label="Lo que incluye tu reserva">
            <span>Clase en vivo</span><span>Skills + guía</span><span>4 ebooks</span>
          </div>
        </div>
        <div className="class-checkout-panel">
          <div className="class-offer-grid">
            {currentOffer ? (
              <button
                key={currentOffer.offerKey}
                type="button"
                className="class-offer is-selected"
                disabled={status === "loading"}
                onClick={() => setSelectedOfferKey(currentOffer.offerKey)}
                aria-pressed="true"
              >
                <span className="class-offer-label">{currentOffer.label}</span>
                <strong className="class-offer-price">{formatPrice(currentOffer.amount)}</strong>
                <small>Precio activo ahora</small>
              </button>
            ) : (
              <p className="class-checkout-error">Todos los cupos están reservados.</p>
            )}
          </div>
          <form className="class-checkout-form" onSubmit={handleSubmit}>
            <div className="class-email-field">
              <span className="class-email-step">01 / Reserva tu acceso</span>
              <label htmlFor="class-email">Escribe el correo donde recibirás tu confirmación</label>
              <input
                id="class-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
              <span className="class-email-prompt" aria-hidden="true">Tu acceso a Google Meet y materiales llegarán aquí</span>
            </div>
            <div className="class-checkout-row">
              <button className="button button-dark" type="submit" disabled={!selectedOffer || status === "loading"}>
                {status === "loading" ? "Preparando tu reserva…" : `Quiero reservar por ${selectedOffer ? formatPrice(selectedOffer.amount) : ""}`} <span>↗</span>
              </button>
            </div>
            <p className="class-checkout-note">Tu cupo queda reservado durante 30 minutos mientras completas el pago. El siguiente precio se activa cuando se agota este tramo.</p>
            {error && <p className="class-checkout-error" role="alert">{error}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
