"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { WORKSHOP_PRICE, WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";

type Availability = {
  available: boolean;
  offerKey: string;
  amount: number;
  nextAmount: number;
  salesToday: number;
};

const formatCLP = (amount: number) => `$${amount.toLocaleString("es-CL")}`;

export default function WorkshopCheckout() {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function refresh() {
    const response = await fetch("/api/workshop/availability", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No pudimos verificar el precio.");
    setAvailability(data);
    setError("");
  }

  useEffect(() => {
    refresh().catch((reason) => setError(reason instanceof Error ? reason.message : "No pudimos verificar el precio."));
    const interval = window.setInterval(() => refresh().catch(() => undefined), 30_000);
    trackEvent("workshop_checkout_viewed", { product: WORKSHOP_PRODUCT_KEY, amount: WORKSHOP_PRICE });
    trackMetaEvent("ViewContent", { content_ids: [WORKSHOP_PRODUCT_KEY], content_type: "product", currency: "CLP", value: WORKSHOP_PRICE });
    const sessionId = getSessionId();
    const query = new URLSearchParams(window.location.search);
    fetch("/api/workshop/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "page_view", sessionId, source: query.get("utm_source"), medium: query.get("utm_medium"), campaign: query.get("utm_campaign"), referrer: document.referrer || null }), keepalive: true }).catch(() => undefined);
    return () => window.clearInterval(interval);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!availability?.available || !email) return;
    setStatus("loading");
    setError("");
    trackEvent("workshop_checkout_started", { product: WORKSHOP_PRODUCT_KEY, amount: availability.amount });
    const query = new URLSearchParams(window.location.search);
    const sessionId = getSessionId();
    fetch("/api/workshop/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "checkout_started", sessionId }), keepalive: true }).catch(() => undefined);
    const response = await fetch("/api/workshop/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, offerKey: availability.offerKey, sessionId, source: query.get("utm_source"), medium: query.get("utm_medium"), campaign: query.get("utm_campaign"), referrer: document.referrer || null }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.error) {
      setStatus("error");
      setError(data.error ?? "No pudimos iniciar el pago. Intenta nuevamente.");
      await refresh().catch(() => undefined);
      return;
    }
    trackMetaEvent("InitiateCheckout", { content_ids: [WORKSHOP_PRODUCT_KEY], content_type: "product", currency: "CLP", value: availability.amount });
    window.location.assign(data.redirectUrl);
  }

  const amount = availability?.amount ?? WORKSHOP_PRICE;

  return (
    <section id="comprar" className="workshop-checkout" aria-labelledby="workshop-checkout-title">
      <div className="workshop-checkout-topline">
        <span>Precio vigente</span>
        <strong>{formatCLP(amount)} CLP</strong>
      </div>
      {Boolean(availability?.salesToday) && (
        <p className="workshop-live-proof" role="status">
          <i /> {availability?.salesToday} {availability?.salesToday === 1 ? "persona reservó" : "personas reservaron"} hoy
        </p>
      )}
      <h2 id="workshop-checkout-title">
        Pocos cupos a {formatCLP(amount)}.
      </h2>
      <p className="workshop-checkout-copy">
        Después sube a <strong>{formatCLP(availability?.nextAmount ?? amount + 5_000)}</strong>. Reserva ahora y conserva el precio que aparece al iniciar el pago.
      </p>
      <ul className="workshop-checkout-assurance" aria-label="Proceso de compra">
        <li>Sin crear cuenta</li>
        <li>Acceso automático por correo</li>
      </ul>
      <form onSubmit={submit}>
        <label htmlFor="workshop-email">Correo de acceso</label>
        <input id="workshop-email" type="email" required autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        <button type="submit" disabled={!availability?.available || status === "loading"}>
          {status === "loading" ? "Preparando pago…" : !availability ? "Verificando precio…" : `Pagar ${formatCLP(amount)}`} <span>↗</span>
        </button>
      </form>
      <p className="workshop-checkout-fine">Pago seguro con Flow · confirmación inmediata · acceso personal</p>
      {availability && !availability.available && <p className="workshop-checkout-error">Las entradas ya no están disponibles.</p>}
      {error && (
        <div className="workshop-checkout-retry" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => refresh().catch((reason) => setError(reason instanceof Error ? reason.message : "No pudimos verificar el precio."))}>Reintentar</button>
        </div>
      )}
      <a className="workshop-sticky-buy" href="#comprar">
        <span><small>Precio vigente</small>{formatCLP(amount)}</span>
        <strong>Reservar entrada →</strong>
      </a>
    </section>
  );
}

function getSessionId() {
  const key = "crececonia-workshop-session";
  const current = window.sessionStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  window.sessionStorage.setItem(key, created);
  return created;
}
