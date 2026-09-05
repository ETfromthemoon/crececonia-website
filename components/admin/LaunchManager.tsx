"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LaunchDetail } from "@/lib/launches";
import type { LaunchStatus, LaunchTaskStatus } from "@/lib/launch-model";

const STATUS: Record<string, string> = { draft: "Borrador", planning: "En planificación", ready: "Listo", published: "Publicado", completed: "Completado", archived: "Archivado", pending: "Pendiente", blocked: "Bloqueado", not_applicable: "No aplica" };

export default function LaunchManager({ launch, adminKey }: { launch: LaunchDetail; adminKey: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function action(body: Record<string, unknown>) {
    setBusy(String(body.action)); setMessage("");
    const response = await fetch(`/api/admin/launches/${launch.id}`, { method: "PATCH", headers: { "content-type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify(body) });
    const result = await response.json(); setBusy("");
    if (!response.ok) { setMessage(result.error || "No se pudo guardar."); return; }
    setMessage(result.message); router.refresh();
  }
  const active = launch.tiers.find((tier) => tier.status === "active");
  const next = launch.tiers.find((tier) => tier.status === "planned");
  const done = launch.tasks.filter((task) => task.status === "ready" || task.status === "not_applicable").length;
  const brief = `PROYECTO CERNEO — ${launch.name}\nURL pública: /lanzamientos/${launch.slug}\nEstado: ${STATUS[launch.status] || launch.status}\nFecha: ${launch.starts_at ? new Date(launch.starts_at).toLocaleString("es-CL") : "Por definir"}\nProductos: ${launch.products.map((item) => item.title_snapshot).join(", ") || "Por definir"}\nDM: ${launch.dm_keyword || "Por definir"}\nAnuncios: ${launch.ad_campaign_name || "Por definir"}\n\nCERNEO coordina calendario de publicaciones, flujo de DM, anuncios, automatizaciones, entrega y medición. No publicar hasta que el checklist obligatorio esté aprobado.`;
  return <>
    <section className="launch-detail-grid">
      <article className="launch-card"><span>Preparación</span><strong>{done}/{launch.tasks.length}</strong><p>requisitos resueltos</p></article>
      <article className="launch-card"><span>Tramo activo</span><strong>{active ? `$${active.amount_minor.toLocaleString("es-CL")}` : "Sin precio"}</strong><p>{active?.label || "Configurable"}</p></article>
      <article className="launch-card"><span>CERNEO</span><strong>{launch.cerneo_status === "ready" ? "Listo" : launch.cerneo_status === "linked" ? "Vinculado" : "Pendiente"}</strong><p>coordinación central</p></article>
    </section>
    <section className="launch-panel"><div className="launch-section-head"><span>Configuración operativa</span><h2>Enlaces y captación.</h2></div>
      <form action={(data) => action({ action: "update", cerneoProjectUrl: data.get("cerneoProjectUrl"), ctaUrl: data.get("ctaUrl"), ctaLabel: data.get("ctaLabel"), dmKeyword: data.get("dmKeyword"), adCampaignName: data.get("adCampaignName"), automationNotes: data.get("automationNotes") })} className="launch-form-grid">
        <label className="wide"><span>Proyecto CERNEO</span><input name="cerneoProjectUrl" type="url" defaultValue={launch.cerneo_project_url || ""} placeholder="https://..." /></label>
        <label><span>Texto del botón</span><input name="ctaLabel" defaultValue={launch.cta_label} /></label><label><span>Destino</span><input name="ctaUrl" type="url" defaultValue={launch.cta_url || ""} /></label>
        <label><span>Palabra clave DM</span><input name="dmKeyword" defaultValue={launch.dm_keyword || ""} /></label><label><span>Campaña de anuncios</span><input name="adCampaignName" defaultValue={launch.ad_campaign_name || ""} /></label>
        <label className="wide"><span>Notas de automatización</span><textarea name="automationNotes" rows={3} defaultValue={launch.automation_notes || ""}/></label>
        <button className="launch-secondary" disabled={busy === "update"}>Guardar configuración</button>
      </form>
    </section>
    {launch.tiers.length > 0 && <section className="launch-panel"><div className="launch-section-head"><span>Precio dinámico</span><h2>Tramos independientes.</h2><p>Este control pertenece sólo a este lanzamiento.</p></div><div className="launch-tier-row">{launch.tiers.map((tier) => <article key={tier.id} data-status={tier.status}><span>{tier.status === "active" ? "Activo" : tier.status === "planned" ? "Siguiente" : "Cerrado"}</span><b>{tier.label}</b><strong>${tier.amount_minor.toLocaleString("es-CL")}</strong><small>{tier.sold_count}/{tier.capacity} ocupados</small></article>)}</div>{next && <button className="launch-secondary" disabled={busy === "advance_tier"} onClick={() => action({ action: "advance_tier" })}>Avanzar al siguiente tramo (+${launch.price_step_minor.toLocaleString("es-CL")})</button>}</section>}
    <section className="launch-panel"><div className="launch-section-head"><span>Checklist de salida</span><h2>CERNEO coordina el lanzamiento completo.</h2><p>Marca cada bloque sólo después de probarlo o documentarlo.</p></div><div className="launch-checklist">{launch.tasks.map((task) => <article key={task.id} data-status={task.status}><div><span>{task.category}</span><h3>{task.title}</h3><p>{task.instructions}</p></div><select aria-label={`Estado de ${task.title}`} value={task.status} onChange={(event) => action({ action: "task", taskId: task.id, status: event.target.value as LaunchTaskStatus })}><option value="pending">Pendiente</option><option value="ready">Listo</option><option value="blocked">Bloqueado</option><option value="not_applicable">No aplica</option></select></article>)}</div></section>
    <section className="launch-panel launch-brief"><div className="launch-section-head"><span>Instrucción generada</span><h2>Brief para CERNEO.</h2></div><pre>{brief}</pre><button className="launch-secondary" onClick={() => navigator.clipboard.writeText(brief)}>Copiar instrucción</button></section>
    <section className="launch-panel"><div className="launch-section-head"><span>Estado</span><h2>{STATUS[launch.status]}</h2><p>Publicar exige CERNEO y todas las tareas obligatorias aprobadas.</p></div><div className="launch-status-actions">{(["draft","planning","ready","published","completed","archived"] as LaunchStatus[]).map((status) => <button key={status} disabled={status === launch.status || busy === "transition"} onClick={() => action({ action: "transition", status })}>{STATUS[status]}</button>)}</div></section>
    {message && <p className="launch-toast">{message}</p>}
  </>;
}
