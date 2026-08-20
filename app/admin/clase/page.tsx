import { notFound } from "next/navigation";
import ClassAulaSettingsForm from "@/components/admin/ClassAulaSettingsForm";
import { getClassAulaSettings } from "@/lib/class-aula-settings";
import { CLASS_DATE_LABEL, CLASS_SESSION_LABEL, CLASS_TITLE } from "@/lib/class-product";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Order = { id: string; commerce_order: string; email: string; amount_minor: number; status: string; paid_at: string | null; created_at: string; offer_id: string; flow_order?: number | null; has_flow_token?: boolean };
type Offer = { id: string; label: string; total_cupos: number; sold_cupos: number };
type DeliveryEvent = { class_order_id: string; delivery_kind: string; status: string; sent_at: string | null; last_error: string | null };

const surface = { background: "var(--carbon)", border: "1px solid var(--border)", borderRadius: 4 } as const;
const mono = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" } as const;

export default async function AdminClassPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) notFound();

  const [settings, dashboardResult] = await Promise.all([
    getClassAulaSettings(),
    getSupabaseAdmin().rpc("class_admin_dashboard"),
  ]);

  const dashboard = (dashboardResult.data ?? {}) as { orders?: Order[]; offers?: Offer[]; deliveries?: DeliveryEvent[] };
  const orders = dashboard.orders ?? [];
  const offers = dashboard.offers ?? [];
  const events = dashboard.deliveries ?? [];
  const paidOrders = orders.filter((order) => order.status === "paid");
  const totalCLP = paidOrders.reduce((total, order) => total + order.amount_minor, 0);
  const flowConfirmed = paidOrders.filter((order) => order.flow_order && order.has_flow_token).length;
  const offerById = new Map(offers.map((offer) => [offer.id, offer]));
  const eventByOrder = new Map<string, DeliveryEvent[]>();
  for (const event of events) eventByOrder.set(event.class_order_id, [...(eventByOrder.get(event.class_order_id) ?? []), event]);
  const sent = (kind: string) => events.filter((event) => event.delivery_kind === kind && event.status === "sent").length;
  const failures = events.filter((event) => event.status === "failed");
  const adminQuery = `key=${encodeURIComponent(key)}`;
  const presenterHref = `/admin/clase/presentacion?${adminQuery}`;
  const fmtDate = (date: string | null) => date ? new Date(date).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" }) : "—";
  const fmtCLP = (amount: number) => `$${amount.toLocaleString("es-CL")} CLP`;

  const statusItems = [
    { label: "Aula alumnos", value: settings.classroomEnabled ? "Publicada" : "Cerrada", ok: settings.classroomEnabled },
    { label: "Google Meet", value: settings.sessionUrl ? "Configurado" : "Pendiente", ok: Boolean(settings.sessionUrl) },
    { label: "WhatsApp", value: settings.whatsappGroupUrl ? "Configurado" : "Pendiente", ok: Boolean(settings.whatsappGroupUrl) },
    { label: "Flow", value: `${flowConfirmed}/${paidOrders.length} confirmados`, ok: flowConfirmed === paidOrders.length },
    { label: "Grabación", value: settings.recordingUrl ? "Disponible" : "Aún no", ok: Boolean(settings.recordingUrl) },
  ];

  return (
    <main style={{ background: "var(--obsidian)", color: "var(--bone)", minHeight: "100vh", padding: "42px 24px 72px", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <p style={{ ...mono, color: "var(--champagne)", margin: "0 0 10px" }}>Admin · CrececonIA · Aula en vivo</p>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, maxWidth: 750 }}>{CLASS_TITLE}</h1>
            <p style={{ color: "var(--smoke)", margin: "10px 0 0" }}>{CLASS_DATE_LABEL} · {CLASS_SESSION_LABEL}</p>
          </div>
          <a className="btn-primary" href={presenterHref} style={{ textDecoration: "none" }}>Abrir modo relator →</a>
        </div>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
          {statusItems.map((item) => <div key={item.label} style={{ ...surface, padding: "16px 18px" }}><p style={{ ...mono, color: "var(--smoke)", margin: 0 }}>{item.label}</p><p style={{ color: item.ok ? "var(--champagne)" : "#e07a5f", margin: "9px 0 0", fontSize: 17 }}>{item.value}</p></div>)}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, .55fr)", gap: 20, marginBottom: 32 }}>
          <div style={{ ...surface, padding: 24 }}>
            <p style={{ ...mono, color: "var(--champagne)", margin: "0 0 8px" }}>01 · Operación antes de abrir</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, margin: "0 0 12px" }}>Enlaces y disponibilidad del aula</h2>
            <p style={{ color: "var(--smoke)", margin: "0 0 20px", maxWidth: 680 }}>Este es el único lugar para cambiar Meet, WhatsApp, grabación, soporte y abrir o cerrar el aula. Al guardar, los alumnos ven el cambio al recargar su enlace personal.</p>
            <ClassAulaSettingsForm adminKey={key} initialSettings={settings} />
          </div>
          <aside style={{ ...surface, padding: 24 }}>
            <p style={{ ...mono, color: "var(--champagne)", margin: "0 0 12px" }}>Mapa rápido</p>
            {["Configuras enlaces", "Abres modo relator", "Alumnos entran con link personal", "Entregas y seguimiento se registran"].map((item, index) => (
              <div
                key={item}
                style={{
                  display: "grid",
                  gridTemplateColumns: "26px 1fr",
                  gap: 10,
                  padding: "12px 0",
                  borderTop: index ? "1px solid var(--border)" : "none",
                }}
              >
                <span style={{ color: "var(--champagne)", fontFamily: "var(--font-mono)" }}>0{index + 1}</span>
                <span style={{ color: "var(--ash)", fontSize: 14 }}>{item}</span>
              </div>
            ))}
            <p style={{ borderTop: "1px solid var(--border)", paddingTop: 16, color: "var(--smoke)", fontSize: 12, lineHeight: 1.55, margin: "12px 0 0" }}>El modo relator tiene el slider completo, notas con la tecla N y navegación por flechas o espacio.</p>
          </aside>
        </section>

        <section style={{ marginBottom: 32 }}>
          <p style={{ ...mono, color: "var(--champagne)", margin: "0 0 10px" }}>02 · Estado comercial y entregas</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
            {[{ label: "Pagos confirmados", value: paidOrders.length }, { label: "Recaudación", value: fmtCLP(totalCLP) }, { label: "Accesos al aula enviados", value: sent("hub") }, { label: "Seguimientos enviados", value: sent("follow-up") }, { label: "Entregas con error", value: failures.length }].map((item) => <div key={item.label} style={{ ...surface, padding: "18px" }}><p style={{ ...mono, color: "var(--smoke)", margin: 0 }}>{item.label}</p><strong style={{ display: "block", color: item.label === "Entregas con error" && Number(item.value) > 0 ? "#e07a5f" : "var(--champagne)", fontSize: 22, fontWeight: 400, marginTop: 10 }}>{item.value}</strong></div>)}
          </div>
        </section>

        <section style={{ ...surface, padding: 24, marginBottom: 32 }}>
          <p style={{ ...mono, color: "var(--champagne)", margin: "0 0 8px" }}>03 · Asistentes y trazabilidad</p>
          <h2 style={{ margin: "0 0 18px", fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300 }}>Compras de la clase</h2>
          {paidOrders.length === 0 ? <p style={{ color: "var(--smoke)" }}>Aún no hay pagos confirmados.</p> : <div style={{ overflowX: "auto" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720, fontSize: 13 }}><thead><tr style={{ textAlign: "left", color: "var(--smoke)", borderBottom: "1px solid var(--border)" }}>{["Email", "Oferta", "Pago", "Aula", "Seguimiento", "Fecha"].map((heading) => <th key={heading} style={{ ...mono, padding: "9px 10px", fontWeight: 400 }}>{heading}</th>)}</tr></thead><tbody>{paidOrders.map((order, index) => { const deliveries = eventByOrder.get(order.id) ?? []; const delivered = (kind: string) => deliveries.some((event) => event.delivery_kind === kind && event.status === "sent"); return <tr key={order.id} style={{ background: index % 2 ? "rgba(255,255,255,.015)" : "transparent", borderBottom: "1px solid rgba(255,255,255,.05)" }}><td style={{ padding: "11px 10px" }}>{order.email}</td><td style={{ padding: "11px 10px", color: "var(--ash)" }}>{offerById.get(order.offer_id)?.label ?? "Clase"}</td><td style={{ padding: "11px 10px", color: "var(--champagne)", fontFamily: "var(--font-mono)" }}>{fmtCLP(order.amount_minor)}</td><td style={{ padding: "11px 10px", color: delivered("hub") ? "var(--champagne)" : "var(--smoke)" }}>{delivered("hub") ? "Enviado" : "Pendiente"}</td><td style={{ padding: "11px 10px", color: delivered("follow-up") ? "var(--champagne)" : "var(--smoke)" }}>{delivered("follow-up") ? "Enviado" : "Pendiente"}</td><td style={{ padding: "11px 10px", color: "var(--smoke)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(order.paid_at ?? order.created_at)}</td></tr>; })}</tbody></table></div>}
          {failures.length > 0 && <p style={{ color: "#e07a5f", fontSize: 13, margin: "18px 0 0" }}>Hay {failures.length} entrega(s) con error. Revisa el correo/configuración antes de reintentar desde el flujo de soporte.</p>}
        </section>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <a href={presenterHref} className="btn-primary" style={{ textDecoration: "none" }}>Presentación del relator</a>
          <a href={`/admin/ebook?${adminQuery}`} style={{ color: "var(--bone)", border: "1px solid var(--border)", padding: "10px 14px", borderRadius: 4, textDecoration: "none", fontSize: 13 }}>Entregas de ebooks</a>
          <a href={`/admin/descuentos?${adminQuery}`} style={{ color: "var(--bone)", border: "1px solid var(--border)", padding: "10px 14px", borderRadius: 4, textDecoration: "none", fontSize: 13 }}>Códigos de descuento</a>
        </nav>
      </div>
    </main>
  );
}
