"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function FiscalEvidenceForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const issuedAt = new Date(String(values.get("issuedAt")));
    if (Number.isNaN(issuedAt.getTime())) {
      setMessage("Selecciona una fecha válida.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/marketplace/fiscal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          documentKind: values.get("documentKind"),
          documentReference: values.get("documentReference"),
          issuedAt: issuedAt.toISOString(),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "No se pudo guardar el comprobante.");
        return;
      }
      form.reset();
      setMessage("Comprobante registrado.");
      router.refresh();
    } catch {
      setMessage("No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} style={{ display: "grid", gap: 8, marginTop: 14, maxWidth: 420 }}>
    <label>Tipo de respaldo
      <select name="documentKind" required defaultValue="boleta" style={{ display: "block", width: "100%", color: "#111" }}>
        <option value="boleta">Boleta emitida</option>
        <option value="voucher">Voucher de Flow</option>
      </select>
    </label>
    <label>Folio o referencia
      <input name="documentReference" required minLength={3} maxLength={120} style={{ display: "block", width: "100%", color: "#111" }} />
    </label>
    <label>Fecha y hora de emisión
      <input name="issuedAt" type="datetime-local" required style={{ display: "block", width: "100%", color: "#111" }} />
    </label>
    <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Registrar comprobante"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
