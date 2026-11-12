import { requireAdminSession } from "@/lib/admin-auth";
import { InvalidQualificationQuery, loadQualificationInbox, qualificationSyncView, type QualificationInbox } from "@/lib/admin-qualifications";

export const dynamic = "force-dynamic";
const basePath = "/admin/postulaciones";
const formatDate = (value: string) => new Date(value).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "medium", timeStyle: "short" });
const serviceName = (value: string) => value === "mentoria" ? "Mentoría" : value === "implementacion" ? "Implementación" : "Servicio no reconocido";
const cell = { padding: "14px 12px", textAlign: "left" as const, verticalAlign: "top", borderBottom: "1px solid var(--border)" };

export default async function QualificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminSession();
  const params = await searchParams;
  let inbox: QualificationInbox | undefined;
  let error = "";
  try {
    if (Array.isArray(params.cursor) || Array.isArray(params.id)) throw new InvalidQualificationQuery();
    inbox = await loadQualificationInbox({ cursor: params.cursor, id: params.id });
  } catch (reason) {
    error = reason instanceof InvalidQualificationQuery
      ? "El enlace de paginación o de detalle no es válido. Vuelve al inicio de la bandeja."
      : "No pudimos consultar las postulaciones. No se puede determinar si hay registros; vuelve a intentarlo más tarde.";
  }
  return <main style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 1280, margin: "0 auto" }}>
    <p><a href="/admin/ebook">← Administración</a></p>
    <h1 style={{ fontSize: "2rem", margin: "24px 0 12px" }}>Postulaciones de servicios</h1>
    <p>Registro web y estado técnico de sincronización. El seguimiento comercial se gestiona en Nítido.</p>
    <p style={{ margin: "12px 0 24px" }}>“Registrada en web” no significa “sin contactar”. “Sincronizada” no confirma una conversación ni una venta. Fechas en horario de Chile.</p>
    {error && <section role="alert"><h2>Consulta no disponible</h2><p>{error}</p><a href={basePath}>Volver al inicio</a></section>}
    {inbox && <>
      {!inbox.integrationInstalled && <p role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>Integración no instalada: la cola de Nítido todavía no está disponible. Las postulaciones guardadas siguen visibles aquí.</p>}
      {inbox.detailRequested && !inbox.detail && <p role="status">No se encontró esa postulación. La lista sigue disponible abajo.</p>}
      {inbox.detail && <section aria-labelledby="qualification-detail" style={{ border: "1px solid var(--border)", padding: 24, margin: "24px 0" }}>
        <h2 id="qualification-detail" style={{ fontSize: "1.5rem" }}>Detalle de la postulación</h2>
        <dl style={{ display: "grid", gap: 16, marginTop: 20, overflowWrap: "anywhere" }}>
          {[
            ["Nombre", inbox.detail.name], ["Correo", inbox.detail.email], ["Empresa o contexto", inbox.detail.company],
            ["Servicio", serviceName(inbox.detail.service)], ["Registrada", formatDate(inbox.detail.created_at)],
            ["Rol", inbox.detail.role], ["Resultado o proceso", inbox.detail.result], ["Inversión declarada", inbox.detail.budget],
            ["Disponibilidad", inbox.detail.availability], ["Herramientas y contexto", inbox.detail.context], ["Decisión", inbox.detail.decision],
          ].map(([label, value]) => <div key={label}><dt style={{ fontWeight: 600 }}>{label}</dt><dd style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{value || "No corresponde o no informado"}</dd></div>)}
          <div><dt style={{ fontWeight: 600 }}>Sincronización técnica</dt><dd>{qualificationSyncView(inbox.detail, inbox.integrationInstalled, inbox.now).label}</dd></div>
          <div><dt style={{ fontWeight: 600 }}>Próxima acción operativa</dt><dd>{qualificationSyncView(inbox.detail, inbox.integrationInstalled, inbox.now).action}</dd></div>
          {inbox.detail.lease_expires_at && <div><dt style={{ fontWeight: 600 }}>Vencimiento de la última reserva</dt><dd>{formatDate(inbox.detail.lease_expires_at)}</dd></div>}
          {inbox.detail.next_attempt_at && ["pending", "leased"].includes(inbox.detail.sync_status ?? "") && <div><dt style={{ fontWeight: 600 }}>Elegible para otro intento desde</dt><dd>{formatDate(inbox.detail.next_attempt_at)}. Depende del estado y disponibilidad del proceso; no es una hora garantizada de ejecución.</dd></div>}
        </dl>
        <p style={{ marginTop: 20 }}><a href={typeof params.cursor === "string" ? `${basePath}?cursor=${encodeURIComponent(params.cursor)}` : basePath}>Cerrar detalle</a></p>
      </section>}
      <section aria-labelledby="qualification-list" style={{ marginTop: 24 }}>
        <h2 id="qualification-list">Postulaciones registradas</h2>
        {inbox.rows.length === 0 ? <p>No hay postulaciones en esta página.</p> : <div style={{ overflowX: "auto" }} tabIndex={0} role="region" aria-label="Tabla de postulaciones, desplazable horizontalmente">
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <caption style={{ textAlign: "left", padding: "8px 0" }}>Hasta 25 registros, más recientes primero. Abre el detalle para revisar las respuestas.</caption>
            <thead><tr>{["Nombre / empresa", "Servicio / registro", "Sincronización", "Acción operativa", "Detalle"].map(label => <th scope="col" key={label} style={cell}>{label}</th>)}</tr></thead>
            <tbody>{inbox.rows.map(row => {
              const sync = qualificationSyncView(row, inbox.integrationInstalled, inbox.now);
              const detailParams = new URLSearchParams({ id: row.id });
              if (typeof params.cursor === "string") detailParams.set("cursor", params.cursor);
              return <tr key={row.id}>
                <th scope="row" style={{ ...cell, overflowWrap: "anywhere" }}>{row.name || "Nombre no informado"}<br /><span style={{ fontWeight: 400 }}>{row.company || "Empresa no informada"}</span></th>
                <td style={cell}>{serviceName(row.service)}<br /><time dateTime={row.created_at}>{formatDate(row.created_at)}</time><br /><small>Registrada en web</small></td>
                <td style={cell}>{sync.label}{row.attempts !== null && <><br /><small>Intentos: {row.attempts}/8</small></>}</td>
                <td style={cell}>{sync.action}</td>
                <td style={cell}><a href={`${basePath}?${detailParams.toString()}`} aria-label={`Ver postulación de ${row.name || "persona"}`}>Ver detalle</a></td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
        <nav aria-label="Paginación de postulaciones" style={{ display: "flex", gap: 24, margin: "24px 0" }}>
          {params.cursor && <a href={basePath}>Volver a las más recientes</a>}
          {inbox.nextCursor && <a href={`${basePath}?cursor=${encodeURIComponent(inbox.nextCursor)}`}>Ver anteriores →</a>}
        </nav>
      </section>
    </>}
  </main>;
}
