"use client";

import { useCallback, useEffect, useState } from "react";

type Health = { ok: boolean; generatedAt: string; checks: Array<{ key: string; label: string; ok: boolean; detail: string; blocking?: boolean }> };

export default function WorkshopHealthPanel({ adminKey }: { adminKey: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/workshop-health", { headers: { "x-admin-key": adminKey }, cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "No se pudo verificar el workshop.");
    setHealth(data); setError("");
  }, [adminKey]);
  useEffect(() => { void refresh().catch((reason) => setError(reason.message)); }, [refresh]);
  return <section className="workshop-admin-health">
    <div><div><p>Verificación operativa</p><h2>{health?.ok ? "Todo listo para vender." : "Revisa los puntos pendientes."}</h2></div><button type="button" onClick={() => void refresh().catch((reason) => setError(reason.message))}>Verificar ahora</button></div>
    {error && <p className="workshop-admin-error">{error}</p>}
    <div>{health?.checks.map((check) => <article key={check.key} className={check.ok ? "is-ok" : "is-pending"}><i>{check.ok ? "✓" : check.blocking === false ? "…" : "!"}</i><span><strong>{check.label}</strong><small>{check.detail}</small></span></article>) ?? <p>Verificando base de datos, Storage, grabación y correo…</p>}</div>
  </section>;
}
