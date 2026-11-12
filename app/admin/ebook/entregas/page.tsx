import { requireAdminSession } from "@/lib/admin-auth";
import { ebookDeliveryView, ebookIncidentDescription, InvalidDeliveryQuery, loadEbookDeliveryInbox, type DeliveryInbox } from "@/lib/admin-ebook-deliveries";

export const dynamic = "force-dynamic";
const basePath = "/admin/ebook/entregas";
const date = (value: string) => new Date(value).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "medium", timeStyle: "short" });
const cell = { padding: "14px 12px", textAlign: "left" as const, verticalAlign: "top", borderBottom: "1px solid var(--border)" };

export default async function EbookDeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminSession();
  const params = await searchParams;
  let inbox: DeliveryInbox | undefined;
  let error = "";
  try {
    if (Array.isArray(params.cursor)) throw new InvalidDeliveryQuery();
    inbox = await loadEbookDeliveryInbox({ cursor: params.cursor });
  } catch (reason) {
    error = reason instanceof InvalidDeliveryQuery ? "El enlace de paginación no es válido. Vuelve al inicio."
      : "No pudimos consultar las entregas. No se puede determinar si hay registros o incidentes.";
  }
  return <main style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 1280, margin: "0 auto" }}>
    <p><a href="/admin/ebook">← Administración</a></p>
    <h1 style={{ fontSize: "2rem", margin: "24px 0 12px" }}>Entregas de ebooks</h1>
    <p>Consulta de solo lectura. La aceptación del correo y los efectos de la compra se revisan por separado.</p>
    <p style={{ margin: "12px 0 24px" }}>Aceptado por Resend no significa entregado ni descargado. No se muestran destinatarios ni enlaces privados. Fechas en horario de Chile.</p>
    {error && <section role="alert"><h2>Consulta no disponible</h2><p>{error}</p><a href={basePath}>Volver al inicio</a></section>}
    {inbox && <>
      {inbox.schema !== "complete" && <p role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>
        {inbox.schema === "absent" ? "Infraestructura de entrega no instalada. No se puede consultar esta cola; no equivale a cero compras ni cero correos enviados."
          : "Infraestructura parcialmente instalada. Los datos disponibles no permiten confirmar todos los efectos contables. Requiere revisión técnica."}
      </p>}
      {inbox.rows.length === 0 ? inbox.schema === "complete" && <p>No hay trabajos de entrega en esta página. Esto no acredita el estado de compras históricas.</p>
        : <div style={{ overflowX: "auto", marginTop: 24 }} tabIndex={0} role="region" aria-label="Tabla de entregas, desplazable horizontalmente">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <caption style={{ textAlign: "left", padding: "8px 0" }}>Hasta 25 trabajos, más recientes primero. Esta pantalla no envía ni reintenta correos.</caption>
            <thead><tr>{["Orden / registro", "Correo", "Revisión operativa", "Efectos de la compra"].map(label => <th key={label} scope="col" style={cell}>{label}</th>)}</tr></thead>
            <tbody>{inbox.rows.map(row => {
              const view = ebookDeliveryView(row, inbox.now);
              return <tr key={row.id}>
                <th scope="row" style={cell}>Flow {row.flowOrder}<br /><time dateTime={row.createdAt}>{date(row.createdAt)}</time></th>
                <td style={cell}>{view.label}<br /><small>Intentos: {row.attempts}/5</small>
                  {row.providerAcceptedAt && <><br /><small>Aceptación registrada: {date(row.providerAcceptedAt)}</small></>}
                  {row.leaseExpiresAt && <><br /><small>Reserva hasta: {date(row.leaseExpiresAt)}</small></>}
                  {row.nextAttemptAt && ["pending", "retry"].includes(row.status) && <><br /><small>Elegible desde: {date(row.nextAttemptAt)}; no garantiza ejecución.</small></>}
                  {row.incidents.filter(incident => incident.kind === "delivery").map((incident, index) => <p key={index}>{ebookIncidentDescription(incident)}</p>)}
                </td>
                <td style={cell}>{view.guidance}</td>
                <td style={cell}>{row.receiptRecorded === null ? "No disponibles: instalación parcial."
                  : <>{row.receiptRecorded ? "Finalización registrada." : "Sin recibo de finalización; revisar."}<br />
                    Efectos aplicados: {row.effectsApplied}. Incidencias pendientes: {row.effectsReview}.
                    <br /><small>Una incidencia de cupo o descuento no demuestra fallo de correo ni revoca acceso.</small></>}
                  {row.incidents.filter(incident => incident.kind !== "delivery").map((incident, index) => <p key={index}>
                    <strong>{incident.kind === "cupo" ? `Cupo · ${incident.resource}` : "Descuento"}</strong><br />{ebookIncidentDescription(incident)}
                  </p>)}
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>}
      <nav aria-label="Paginación de entregas" style={{ display: "flex", gap: 24, margin: "24px 0" }}>
        {params.cursor && <a href={basePath}>Volver a las más recientes</a>}
        {inbox.nextCursor && <a href={`${basePath}?cursor=${encodeURIComponent(inbox.nextCursor)}`}>Ver anteriores →</a>}
      </nav>
    </>}
  </main>;
}
