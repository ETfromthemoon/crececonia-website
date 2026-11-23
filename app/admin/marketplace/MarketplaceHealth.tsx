"use client";

import { useState } from "react";
import styles from "./panel.module.css";

const checks = [
  ["database", "Base de datos"],
  ["storage_list", "Lectura de almacenamiento privado"],
  ["storage_upload_configured", "Configuración de carga"],
] as const;
type Health = Record<(typeof checks)[number][0], boolean>;

export default function MarketplaceHealth() {
  const [state, setState] = useState<Health | "checking" | "unauthorized" | "error" | null>(null);

  async function checkHealth() {
    setState("checking");
    try {
      const response = await fetch("/api/admin/marketplace/health", { cache: "no-store" });
      if (response.status === 401) return setState("unauthorized");
      if (response.status !== 200 && response.status !== 503) throw new Error();
      const data = await response.json();
      if (!data || !checks.every(([key]) => typeof data[key] === "boolean")) throw new Error();
      setState(data);
    } catch {
      setState("error");
    }
  }

  return <>
    <button className={styles.secondary} type="button" onClick={checkHealth} disabled={state === "checking"}>
      {state === "checking" ? "Comprobando…" : "Comprobar servicios"}
    </button>
    <div role="status">
      {state === "unauthorized" && <p>Tu sesión venció. <a href="/admin/login?next=%2Fadmin%2Fmarketplace">Volver a ingresar</a>.</p>}
      {state === "error" && <p>No pudimos completar la comprobación. Inténtalo de nuevo.</p>}
      {state && typeof state === "object" && <ul className={styles.healthResults}>
        {checks.map(([key, label]) => <li key={key}>{label} <strong data-tone={state[key] ? "ok" : "warn"}>{state[key] ? "Operativo" : "Requiere revisión"}</strong></li>)}
      </ul>}
    </div>
  </>;
}
