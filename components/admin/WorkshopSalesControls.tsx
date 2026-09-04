"use client";

import { useState, type FormEvent } from "react";

type Availability = { label: string; amount: number; nextAmount: number; remaining: number; mode: "live" | "recording" };
const clp = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function WorkshopSalesControls({ adminKey, initial }: { adminKey: string; initial: Availability }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"advance" | "manual" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function mutate(action: "advance" | "manual", payload: Record<string, string> = {}) {
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
  const recording = initial.mode === "recording";

  return <section className="workshop-admin-sales" aria-labelledby="workshop-sales-title">
    <div className="workshop-admin-sales-heading"><div><p>Ventas y precio</p><h2 id="workshop-sales-title">Control de entradas</h2></div><div className="workshop-admin-current-price"><span>{initial.label}</span><strong>{clp(initial.amount)}</strong><small>{recording ? "Acceso grabado" : `${initial.remaining} cupos disponibles`}</small></div></div>
    <div className="workshop-admin-sales-actions">
      <article><span>Cambiar precio</span><h3>Pasar al siguiente tramo</h3><p>Las reservas existentes conservan su valor. Las compras nuevas verán {clp(initial.nextAmount)}.</p><button type="button" disabled={busy !== null || recording} onClick={() => { if (window.confirm(`¿Cerrar ${initial.label} y publicar el siguiente tramo a ${clp(initial.nextAmount)}?`)) void mutate("advance"); }}>{busy === "advance" ? "Cambiando…" : recording ? "Precio fijo de grabación" : `Subir a ${clp(initial.nextAmount)}`}</button></article>
      <article><span>Venta fuera del sistema</span><h3>Agregar comprador</h3><p>Consume un cupo al precio vigente y envía el acceso, los ebooks y la confirmación al correo.</p><form onSubmit={registerManualSale}><label htmlFor="manual-workshop-email">Correo del comprador</label><div><input id="manual-workshop-email" type="email" required autoComplete="email" placeholder="cliente@empresa.cl" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" disabled={busy !== null || !email}>{busy === "manual" ? "Agregando…" : "Agregar compra"}</button></div></form></article>
    </div>
    {message && <p className="workshop-admin-success" role="status">{message}</p>}{error && <p className="workshop-admin-error" role="alert">{error}</p>}
  </section>;
}
