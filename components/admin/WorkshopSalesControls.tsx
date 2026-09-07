"use client";

import { useState, type FormEvent } from "react";

type Availability = { label: string; amount: number; nextAmount: number; remaining: number; mode: "live" | "recording" };
const clp = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function WorkshopSalesControls({ adminKey, initial, availabilityError }: { adminKey: string; initial: Availability | null; availabilityError?: string | null }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"advance" | "manual" | "resend-resources" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function mutate(action: "advance" | "manual" | "resend-resources", payload: Record<string, string> = {}) {
    setBusy(action); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/workshop-sales", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ action, ...payload }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "No se pudo completar la operación.");
      setMessage(data.message);
      if (action === "manual") setEmail("");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo completar la operación."); setBusy(null); }
  }

  function registerManualSale(event: FormEvent) { event.preventDefault(); if (email) void mutate("manual", { email }); }
  const recording = initial?.mode === "recording";

  return <section className="workshop-admin-sales" aria-labelledby="workshop-sales-title">
    <div className="workshop-admin-sales-heading"><div><p>Ventas y precio</p><h2 id="workshop-sales-title">Control de accesos</h2></div><div className="workshop-admin-current-price">{initial ? <><span>{initial.label}</span><strong>{clp(initial.amount)}</strong><small>{recording ? "Acceso grabado" : `${initial.remaining} cupos disponibles`}</small></> : <><span>Venta pausada</span><strong>—</strong><small>Revisa Verificación operativa</small></>}</div></div>
    {availabilityError && <p className="workshop-admin-error" role="alert">No se pudo cargar la oferta: {availabilityError}</p>}
    <div className="workshop-admin-sales-actions">
      <article><span>Cambiar precio</span><h3>Pasar al siguiente tramo</h3><p>{initial ? <>Las reservas existentes conservan su valor. Las compras nuevas verán {clp(initial.nextAmount)}.</> : "Esta acción se habilitará cuando la oferta vuelva a responder."}</p><button type="button" disabled={busy !== null || recording || !initial} onClick={() => { if (initial && window.confirm(`¿Cerrar ${initial.label} y publicar el siguiente tramo a ${clp(initial.nextAmount)}?`)) void mutate("advance"); }}>{busy === "advance" ? "Cambiando…" : !initial ? "Oferta no disponible" : recording ? "Precio fijo de grabación" : `Subir a ${clp(initial.nextAmount)}`}</button></article>
      <article><span>Venta fuera del sistema</span><h3>Agregar comprador</h3><p>Registra una venta externa y envía el acceso, los ebooks y la confirmación al correo.</p><form onSubmit={registerManualSale}><label htmlFor="manual-workshop-email">Correo del comprador</label><div><input id="manual-workshop-email" type="email" required autoComplete="email" placeholder="cliente@empresa.cl" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" disabled={busy !== null || !email || !initial}>{busy === "manual" ? "Agregando…" : "Agregar compra"}</button></div></form></article>
      <article><span>Entrega a alumnos</span><h3>Reenviar grabación y recursos</h3><p>Envía un acceso actualizado a todos los compradores cuando grabación, slides, hoja, skills y sala estén verificados. SKOOL puede quedar pendiente; cuando publiques su enlace, usa nuevamente este botón para avisar a todas las personas.</p><button type="button" disabled={busy !== null} onClick={() => { if (window.confirm("¿Enviar ahora el acceso actualizado a todos los compradores?")) void mutate("resend-resources"); }}>{busy === "resend-resources" ? "Enviando…" : "Enviar recursos a todos"}</button></article>
    </div>
    {message && <p className="workshop-admin-success" role="status">{message}</p>}{error && <p className="workshop-admin-error" role="alert">{error}</p>}
  </section>;
}
