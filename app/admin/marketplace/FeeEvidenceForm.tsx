"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function FeeEvidenceForm({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("confirmedStatement") !== "yes") return;
    const amountMinor = Number(data.get("amountMinor"));
    if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
      setMessage("Indica una tarifa CLP válida.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/marketplace/fees", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentId, amountMinor,
          statementReference: data.get("statementReference"), evidenceNote: data.get("evidenceNote"),
          confirmedStatement: true }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "No se pudo conciliar la tarifa.");
        return;
      }
      setMessage("Tarifa Flow conciliada.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }
  return <details style={{ marginTop: 14 }}>
    <summary>Conciliar tarifa real de Flow</summary>
    <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 12, maxWidth: 420 }}>
      <p>Usa el estado o liquidación de Flow. El saldo del autor queda bloqueado hasta conciliar esta tarifa.</p>
      <label>Tarifa real CLP
        <input name="amountMinor" type="number" min={0} step={1} required style={{ display: "block", width: "100%", color: "#111" }} />
      </label>
      <label>Referencia del estado Flow
        <input name="statementReference" minLength={3} maxLength={120} required style={{ display: "block", width: "100%", color: "#111" }} />
      </label>
      <label>Evidencia (sin datos sensibles)
        <textarea name="evidenceNote" minLength={20} maxLength={2000} required style={{ display: "block", width: "100%", minHeight: 80, color: "#111" }} />
      </label>
      <label><input name="confirmedStatement" type="checkbox" value="yes" required /> Confirmé el importe en el estado de Flow.</label>
      <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Registrar tarifa verificada"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </details>;
}
