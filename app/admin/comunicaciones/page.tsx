import { requireAdminSession } from "@/lib/admin-auth";
import { loadCommunicationSimulation, type CommunicationSimulation } from "@/lib/admin-communication-simulation";
import { communicationReasons, type CommunicationReason } from "@/lib/communication-eligibility";

export const dynamic = "force-dynamic";
export default async function CommunicationSimulationPage() {
  await requireAdminSession();
  let simulation: CommunicationSimulation | undefined;
  try { simulation = await loadCommunicationSimulation(); } catch { /* Render an explicit failure, never zero recipients. */ }
  return <main style={{ maxWidth: 1000, padding: "40px 24px", margin: "0 auto", minHeight: "100vh" }}>
    <a href="/admin/ebook">← Administración</a>
    <h1 style={{ fontSize: "2rem", margin: "24px 0 16px" }}>Preparación de comunicaciones</h1>
    <p>Simulación de solo lectura. No se crean ni envían mensajes.</p>
    <p style={{ margin: "16px 0" }}>Una suscripción histórica o lista de espera no se convierte automáticamente en permiso vigente. Los permisos se evalúan por finalidad; avisar un lanzamiento no autoriza una newsletter.</p>
    {!simulation ? <p role="alert">Consulta no disponible. No podemos determinar candidatos ni preferencias; no equivale a cero registros.</p> : <>
      {simulation.schema !== "complete" && <p role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>
        {simulation.schema === "absent" ? "Registro central de preferencias no instalado. Los candidatos históricos quedan sin evidencia comprobada de permiso."
          : "Registro central parcialmente instalado. No se puede confirmar el permiso efectivo; los candidatos quedan excluidos."}
      </p>}
      {simulation.missingSources.length > 0 && <p role="status">Faltan fuentes de candidatos: {simulation.missingSources.map(source => source === "newsletter" ? "suscripciones" : "listas de espera").join(", ")}. No se muestran como cero registros.</p>}
      {simulation.cohorts.map(cohort => <section key={cohort.purpose} style={{ marginTop: 24, padding: 20, border: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "1.3rem" }}>{cohort.purpose === "newsletter" ? "Suscripciones históricas" : "Avisos de lanzamiento"}</h2>
        <p>Candidatos: {cohort.total}. Excluidos: {cohort.excluded}. Pendientes de verificación: {cohort.pending}.</p>
        <ul>{(Object.entries(cohort.reasons) as [CommunicationReason, number][]).map(([reason, count]) => <li key={reason}>{communicationReasons[reason]}: {count}</li>)}</ul>
        {cohort.total === 0 && <p>No hay candidatos en esta fuente.</p>}
      </section>)}
      <p style={{ marginTop: 24 }}>Los motivos pueden coincidir para una misma persona. Suscripciones se cuentan por correo; avisos por correo y libro, por lo que no se deben sumar como personas únicas.</p>
    </>}
    <p style={{ marginTop: 24 }}>Campañas, frecuencia e historial de envíos siguen pendientes. No se declara elegibilidad para enviar. Recuperar un acceso solicitado es transaccional; recuperar carritos requiere identidad, permiso y estado de pago verificados por separado.</p>
    <p>Este panel no ofrece una baja pública ni activa reingresos. La captura de consentimiento y el mecanismo de baja se implementarán antes de habilitar secuencias.</p>
  </main>;
}
