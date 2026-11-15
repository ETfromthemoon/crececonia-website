"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function SettlementForm({ sellerId, maxMinor }: { sellerId: string; maxMinor: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const amountMinor = Number(data.get("amountMinor"));
    const occurredAt = new Date(String(data.get("occurredAt")));
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0
      || BigInt(amountMinor) > BigInt(maxMinor) || Number.isNaN(occurredAt.getTime())) {
      setMessage("Revisa el monto y la fecha del pago.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/marketplace/settlements", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sellerId, amountMinor, reference: data.get("reference"),
          occurredAt: occurredAt.toISOString(),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "No se pudo registrar el pago.");
        return;
      }
      form.reset();
      setMessage("Pago externo registrado.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 12, maxWidth: 420 }}>
    <p>Registra un pago bancario ya ejecutado. Esta acción no transfiere dinero.</p>
    <label>Monto transferido en CLP
      <input name="amountMinor" type="number" min={1} max={maxMinor} step={1} required
        style={{ display: "block", width: "100%", color: "#111" }} />
    </label>
    <label>Referencia bancaria única
      <input name="reference" minLength={3} maxLength={120} required
        style={{ display: "block", width: "100%", color: "#111" }} />
    </label>
    <label>Fecha y hora de transferencia
      <input name="occurredAt" type="datetime-local" required
        style={{ display: "block", width: "100%", color: "#111" }} />
    </label>
    <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Registrar pago realizado"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
