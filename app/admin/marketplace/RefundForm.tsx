"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function RefundForm({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (data.get("confirmedExternal") !== "yes") return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/marketplace/refunds", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paymentId, kind: data.get("kind"), providerReference: data.get("providerReference"),
          evidenceNote: data.get("evidenceNote"), confirmedExternal: true,
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "No se pudo registrar el reverso.");
        return;
      }
      setMessage("Reverso externo registrado; acceso del comprador revocado.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }
  return <details style={{ marginTop: 14 }}>
    <summary>Registrar devolución o contracargo externo</summary>
    <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 12, maxWidth: 420 }}>
      <p>Solo después de confirmar el reverso completo en Flow o el adquirente. Aquí no se devuelve dinero.</p>
      <label>Tipo
        <select name="kind" defaultValue="refund" style={{ display: "block", width: "100%", color: "#111" }}>
          <option value="refund">Devolución</option><option value="chargeback">Contracargo</option>
        </select>
      </label>
      <label>Referencia del proveedor
        <input name="providerReference" minLength={3} maxLength={120} required style={{ display: "block", width: "100%", color: "#111" }} />
      </label>
      <label>Evidencia y motivo (sin datos sensibles)
        <textarea name="evidenceNote" minLength={20} maxLength={2000} required style={{ display: "block", width: "100%", minHeight: 80, color: "#111" }} />
      </label>
      <label><input name="confirmedExternal" type="checkbox" value="yes" required /> Confirmé que el dinero ya fue revertido fuera de este panel.</label>
      <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Registrar reverso confirmado"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </details>;
}
