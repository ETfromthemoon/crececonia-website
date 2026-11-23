import { requireAdminSession } from "@/lib/admin-auth";
import { inspectBookingPreparation } from "@/lib/service-booking-config";

export const dynamic = "force-dynamic";

export default async function BookingPreparationPage() {
  await requireAdminSession();
  const preparation = inspectBookingPreparation(process.env.SERVICE_BOOKING_CONFIG);
  return <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
    <h1 style={{ fontSize: "2rem", marginBottom: 16 }}>Preparación de reservas</h1>
    <p role="status">{preparation.state === "disabled" ? "Reservas deshabilitadas."
      : preparation.state === "integration_pending" ? "Configuración completa; integración pendiente."
        : "Configuración pendiente."}</p>
    <p style={{ margin: "16px 0" }}>No se ofrecen horarios ni se crean reservas. Las postulaciones siguen su coordinación manual por servicio.</p>
    {preparation.malformed && <p role="alert">La configuración tiene un formato o campos no admitidos. Requiere corrección técnica.</p>}
    <h2 style={{ fontSize: "1.3rem", marginTop: 24 }}>Decisiones y configuración</h2>
    <ul style={{ paddingLeft: 24, lineHeight: 1.8 }}>{preparation.checks.map(check => <li key={check.field}>
      {check.label}: <strong>{check.valid ? "Informado y válido" : "Pendiente o inválido"}</strong>
    </li>)}</ul>
    <h2 style={{ fontSize: "1.3rem", marginTop: 24 }}>Comprobaciones antes de habilitar</h2>
    <p>El adaptador de calendario todavía no está implementado. Completar estos datos no acredita acceso al calendario ni disponibilidad real.</p>
    <p style={{ margin: "12px 0" }}>Faltan persistencia de reservas, control de colisiones, confirmación del proveedor, cancelación, reconciliación y coordinación con Nítido. Una postulación calificada no equivale a una reserva.</p>
    <a href="/admin/postulaciones">Ver postulaciones</a>
  </main>;
}
