"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LaunchDetail } from "@/lib/launches";
import type { LaunchStatus, LaunchTaskStatus } from "@/lib/launch-model";

const STATUS: Record<string, string> = { draft: "Borrador", planning: "En planificación", ready: "Listo", published: "Publicado", completed: "Completado", archived: "Archivado", pending: "Pendiente", connected: "Conectado", error: "Con error", blocked: "Bloqueado", not_applicable: "No aplica" };

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
  const socialAccounts = Array.isArray(launch.zernio_accounts) ? launch.zernio_accounts : [];
  const dmAccounts = socialAccounts.filter((account) => ["instagram", "facebook"].includes(account.platform.toLowerCase()));
  const hasAdsAccount = socialAccounts.some((account) => ["metaads", "googleads", "tiktokads"].includes(account.platform.toLowerCase()));
  const brief = `OPERACIÓN ZERNIO — ${launch.name}\nURL pública: /lanzamientos/${launch.slug}\nEstado: ${STATUS[launch.status] || launch.status}\nFecha: ${launch.starts_at ? new Date(launch.starts_at).toLocaleString("es-CL") : "Por definir"}\nProductos: ${launch.products.map((item) => item.title_snapshot).join(", ") || "Por definir"}\nDM: ${launch.dm_keyword || "Por definir"}\nAnuncios: ${launch.ad_campaign_name || "Por definir"}\n\nEn Zernio: preparar publicaciones como borradores, configurar el flujo de captación por DM y revisar métricas. No publicar, activar anuncios ni generar gasto sin aprobación explícita. Validar además entrega y medición antes de abrir.`;
  return <>
    <section className="launch-detail-grid">
      <article className="launch-card"><span>Preparación</span><strong>{done}/{launch.tasks.length}</strong><p>requisitos resueltos</p></article>
      <article className="launch-card"><span>Tramo activo</span><strong>{active ? `$${active.amount_minor.toLocaleString("es-CL")}` : "Sin precio"}</strong><p>{active?.label || "Configurable"}</p></article>
      <article className="launch-card"><span>Zernio</span><strong>{STATUS[launch.zernio_status] || launch.zernio_status}</strong><p>{socialAccounts.length} cuenta{socialAccounts.length === 1 ? "" : "s"} sincronizada{socialAccounts.length === 1 ? "" : "s"}</p></article>
    </section>
    <section className="launch-panel"><div className="launch-section-head"><span>Conexión Zernio</span><h2>Perfil y canales de CrececonIA.</h2><p>Sincronizar sólo consulta el perfil y sus cuentas. No publica contenido ni activa campañas.</p></div>
      <button className="launch-secondary" disabled={busy === "sync_zernio"} onClick={() => action({ action: "sync_zernio" })}>{busy === "sync_zernio" ? "Sincronizando…" : "Sincronizar Zernio"}</button>
      {launch.zernio_sync_error && <p className="launch-error">{launch.zernio_sync_error}</p>}
      {socialAccounts.length > 0 && <div className="launch-channel-list">{socialAccounts.map((account) => <span key={account.id}><b>{account.platform}</b> @{account.username}</span>)}</div>}
    </section>
    <section className="launch-panel"><div className="launch-section-head"><span>Configuración operativa</span><h2>Enlaces y captación.</h2></div>
      <form action={(data) => action({ action: "update", ctaUrl: data.get("ctaUrl"), ctaLabel: data.get("ctaLabel"), dmKeyword: data.get("dmKeyword"), adCampaignName: data.get("adCampaignName"), automationNotes: data.get("automationNotes") })} className="launch-form-grid">
        <label><span>Texto del botón</span><input name="ctaLabel" defaultValue={launch.cta_label} /></label><label><span>Destino</span><input name="ctaUrl" type="url" defaultValue={launch.cta_url || ""} /></label>
        <label><span>Palabra clave DM</span><input name="dmKeyword" defaultValue={launch.dm_keyword || ""} /></label><label><span>Campaña de anuncios</span><input name="adCampaignName" defaultValue={launch.ad_campaign_name || ""} /></label>
        <label className="wide"><span>Notas de automatización</span><textarea name="automationNotes" rows={3} defaultValue={launch.automation_notes || ""}/></label>
        <button className="launch-secondary" disabled={busy === "update"}>Guardar configuración</button>
      </form>
    </section>
    {socialAccounts.length > 0 && <section className="launch-panel"><div className="launch-section-head"><span>Publicaciones</span><h2>Crear un borrador seguro en Zernio.</h2><p>El contenido queda como borrador. Desde Zernio podrás revisarlo, programarlo o publicarlo.</p></div>
      <form className="launch-form-grid" action={(data) => action({ action: "zernio_post_draft", title: data.get("title"), content: data.get("content"), accountIds: data.getAll("accountIds") })}>
        <label className="wide"><span>Título interno</span><input name="title" required minLength={3} placeholder={`${launch.name} · publicación 1`} /></label>
        <label className="wide"><span>Contenido</span><textarea name="content" required rows={6} placeholder="Texto de la publicación…" /></label>
        <fieldset className="wide launch-account-picker"><legend>Canales</legend>{socialAccounts.map((account) => <label key={account.id}><input type="checkbox" name="accountIds" value={account.id}/><span>{account.platform} · @{account.username}</span></label>)}</fieldset>
        <button className="launch-secondary" disabled={busy === "zernio_post_draft"}>{busy === "zernio_post_draft" ? "Creando…" : "Crear borrador en Zernio"}</button>
      </form>
      {launch.publications.length > 0 && <div className="launch-record-list">{launch.publications.map((item) => <article key={item.id}><b>{item.title}</b><span>{item.status === "synced" ? "Borrador en Zernio" : item.status}</span>{item.zernio_error && <small>{item.zernio_error}</small>}</article>)}</div>}
    </section>}
    {dmAccounts.length > 0 && <section className="launch-panel"><div className="launch-section-head"><span>Captación por DM</span><h2>Automatización de comentarios y mensajes.</h2><p>Atención: al confirmar, la automatización se crea activa en Zernio para la cuenta elegida.</p></div>
      <form className="launch-form-grid" action={(data) => action({ action: "zernio_dm", accountId: data.get("accountId"), keyword: data.get("keyword"), dmMessage: data.get("dmMessage"), commentReply: data.get("commentReply") })}>
        <label><span>Cuenta</span><select name="accountId" required>{dmAccounts.map((account) => <option key={account.id} value={account.id}>{account.platform} · @{account.username}</option>)}</select></label>
        <label><span>Palabra clave</span><input name="keyword" required defaultValue={launch.dm_keyword || ""} placeholder="AGENTES" /></label>
        <label className="wide"><span>Mensaje directo</span><textarea name="dmMessage" required rows={4} placeholder="Aquí tienes el enlace…" /></label>
        <label className="wide"><span>Respuesta pública opcional</span><textarea name="commentReply" rows={2} placeholder="Te lo envié por mensaje directo 🙌" /></label>
        <button className="launch-primary launch-danger-action" disabled={busy === "zernio_dm"}>{busy === "zernio_dm" ? "Activando…" : "Crear y activar flujo de DM"}</button>
      </form>
      {launch.dmAutomations.length > 0 && <div className="launch-record-list">{launch.dmAutomations.map((item) => <article key={item.id}><b>{item.name}</b><span>{item.status === "active" ? "Activo" : item.status}</span>{item.zernio_error && <small>{item.zernio_error}</small>}</article>)}</div>}
    </section>}
    <section className="launch-panel"><div className="launch-section-head"><span>Anuncios</span><h2>{hasAdsAccount ? "Cuenta publicitaria disponible." : "Cuenta publicitaria aún no conectada."}</h2><p>{hasAdsAccount ? "Los anuncios se mantienen pausados hasta una aprobación explícita." : "Conecta la cuenta publicitaria en Zernio para preparar campañas. Este panel nunca activa gasto automáticamente."}</p></div></section>
    {launch.tiers.length > 0 && <section className="launch-panel"><div className="launch-section-head"><span>Precio dinámico</span><h2>Tramos independientes.</h2><p>Este control pertenece sólo a este lanzamiento.</p></div><div className="launch-tier-row">{launch.tiers.map((tier) => <article key={tier.id} data-status={tier.status}><span>{tier.status === "active" ? "Activo" : tier.status === "planned" ? "Siguiente" : "Cerrado"}</span><b>{tier.label}</b><strong>${tier.amount_minor.toLocaleString("es-CL")}</strong><small>{tier.sold_count}/{tier.capacity} ocupados</small></article>)}</div>{next && <button className="launch-secondary" disabled={busy === "advance_tier"} onClick={() => action({ action: "advance_tier" })}>Avanzar al siguiente tramo (+${launch.price_step_minor.toLocaleString("es-CL")})</button>}</section>}
    <section className="launch-panel"><div className="launch-section-head"><span>Checklist de salida</span><h2>Zernio coordina los canales del lanzamiento.</h2><p>Marca cada bloque sólo después de probarlo o documentarlo.</p></div><div className="launch-checklist">{launch.tasks.map((task) => <article key={task.id} data-status={task.status}><div><span>{task.category}</span><h3>{task.title}</h3><p>{task.instructions}</p></div><select aria-label={`Estado de ${task.title}`} value={task.status} onChange={(event) => action({ action: "task", taskId: task.id, status: event.target.value as LaunchTaskStatus })}><option value="pending">Pendiente</option><option value="ready">Listo</option><option value="blocked">Bloqueado</option><option value="not_applicable">No aplica</option></select></article>)}</div></section>
    <section className="launch-panel launch-brief"><div className="launch-section-head"><span>Instrucción generada</span><h2>Brief operativo para Zernio.</h2></div><pre>{brief}</pre><button className="launch-secondary" onClick={() => navigator.clipboard.writeText(brief)}>Copiar instrucción</button></section>
    <section className="launch-panel"><div className="launch-section-head"><span>Estado</span><h2>{STATUS[launch.status]}</h2><p>Publicar exige la conexión con Zernio y todas las tareas obligatorias aprobadas.</p></div><div className="launch-status-actions">{(["draft","planning","ready","published","completed","archived"] as LaunchStatus[]).map((status) => <button key={status} disabled={status === launch.status || busy === "transition"} onClick={() => action({ action: "transition", status })}>{STATUS[status]}</button>)}</div></section>
    {message && <p className="launch-toast">{message}</p>}
  </>;
}
