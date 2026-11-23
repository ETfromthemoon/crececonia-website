import { loadEbookReconciliationReport, reconciliationLabel, type EbookReconciliationReport } from "@/lib/admin-ebook-reconciliation";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
const basePath = "/admin/ebook/conciliacion";
const categories = [
  "historical_unlinked", "job_without_receipt", "receipt_without_job", "receipt_job_mismatch",
  "delivery_pending", "delivery_needs_review", "provider_accepted", "receipt_without_purchase", "job_without_purchase", "purchase_without_flow_order",
] as const;
const cell = { padding: "14px 12px", textAlign: "left" as const, verticalAlign: "top", borderBottom: "1px solid var(--border)" };
const date = (value: string) => new Date(value).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "medium", timeStyle: "short" });

const unavailableMessage: Record<NonNullable<EbookReconciliationReport["unavailableReason"]>, string> = {
  purchase_schema_missing: "No se encontró el esquema de compras esperado. La conciliación no puede determinar cuántas compras hay.",
  durable_schema_absent: "La infraestructura de entrega durable no está instalada. No se puede conciliar su cobertura; esto no equivale a cero compras ni a cero correos pendientes.",
  durable_schema_partial: "La infraestructura de entrega está instalada parcialmente. No se puede determinar el estado de las compras.",
};

export default async function EbookReconciliationPage() {
  await requireAdminSession();
  let report: EbookReconciliationReport | undefined;
  let unavailable = "";
  try {
    report = await loadEbookReconciliationReport();
  } catch {
    unavailable = "No se pudo consultar el reporte. No se puede determinar si existen compras o discrepancias.";
  }

  return <main style={{ minHeight: "100vh", padding: "40px 24px", maxWidth: 1280, margin: "0 auto" }}>
    <p><a href="/admin/ebook/entregas">← Entregas de ebooks</a></p>
    <h1 style={{ fontSize: "2rem", margin: "24px 0 12px" }}>Conciliación de compras y entregas</h1>
    <p>Consulta administrativa de solo lectura. No reintenta trabajos ni envía correos.</p>
    <p style={{ margin: "12px 0 24px" }}>Una compra sin vínculo durable puede corresponder al flujo previo o a una compra reciente procesada antes de activar la finalización durable. No demuestra que falte un correo. La aceptación del proveedor no acredita entrega en bandeja ni descarga. Las referencias son huellas internas de sesión, no IDs de Flow.</p>
    {unavailable && <section role="alert"><h2>Conciliación no disponible</h2><p>{unavailable}</p><a href={basePath}>Volver a consultar</a></section>}
    {report && report.schema === "unavailable" && <section role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>
      <h2>Estado no verificable</h2><p>{unavailableMessage[report.unavailableReason!]}</p>
    </section>}
    {report?.schema === "complete" && <>
      <p>Esquema completo consultado a las {date(report.now)}. Los totales incluyen todo el historial disponible.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, margin: "20px 0" }}>
        {categories.map(category => {
          const item = reconciliationLabel(category);
          return <section key={category} style={{ border: "1px solid var(--border)", padding: 16 }}>
            <h2 style={{ fontSize: 14 }}>{item.label}</h2>
            <p style={{ fontSize: 24, color: "var(--champagne)" }}>{report.counts[category].toLocaleString("es-CL")}</p>
            <small>{item.guidance}</small>
          </section>;
        })}
      </div>
      {report.cases.length === 0 ? <p>No se encontraron órdenes en el esquema consultado.</p> : <div style={{ overflowX: "auto" }} tabIndex={0} role="region" aria-label="Casos de conciliación, desplazable horizontalmente">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption style={{ textAlign: "left", padding: "8px 0" }}>Hasta 25 órdenes más recientes. Huella HMAC estable mientras no cambie ADMIN_SECRET.</caption>
          <thead><tr>{["Referencia", "Último evento observado", "Recursos", "Clasificación y guía"].map(label => <th key={label} scope="col" style={cell}>{label}</th>)}</tr></thead>
          <tbody>{report.cases.map(row => {
            const view = reconciliationLabel(row.category);
            return <tr key={row.reference}>
              <th scope="row" style={cell}>{row.reference}</th>
              <td style={cell}><time dateTime={row.observedAt}>{date(row.observedAt)}</time></td>
              <td style={cell}>{row.resourceCount}</td>
              <td style={cell}><strong>{view.label}</strong><br /><small>{view.guidance}</small></td>
            </tr>;
          })}</tbody>
        </table>
        {report.hasMore && <p role="status">Hay más órdenes en el historial; los totales incluyen todas, esta vista muestra sólo las 25 más recientes.</p>}
      </div>}
    </>}
  </main>;
}
