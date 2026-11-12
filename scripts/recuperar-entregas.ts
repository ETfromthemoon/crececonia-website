/** Conciliación de solo lectura por defecto. --aplicar y --enviar-email son explícitos. */
import { getSupabaseAdmin } from "../lib/supabase";
import { getFlowBase } from "../lib/flow";
import { listPaidFlowPaymentsForDay, planEbookRecovery, type RecoveryManifest, type RecoveryPayment, type RecoveryPurchase } from "../lib/ebook-recovery";
import { sendEbookDeliveryEmail } from "../lib/ebook-delivery-email";
import { sendPurchaseNotification } from "../lib/purchase-notification-email";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

const PRIMERA_VENTA = "2026-06-18";

export async function recoverDeliveries(args: string[] = []) {
  const aplicar = args.includes("--aplicar");
  const enviarEmail = args.includes("--enviar-email");
  if (enviarEmail && !aplicar) throw new Error("--enviar-email requiere --aplicar.");
  const apiKey = process.env.FLOW_API_KEY;
  const secretKey = process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error("Faltan FLOW_API_KEY y/o FLOW_SECRET_KEY.");
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL: la conciliación requiere la base vigente de Neon.");
  const db = getSupabaseAdmin();
  const [purchases, manifests] = await Promise.all([
    db.from("ebook_purchases").select("flow_order, resource"),
    db.from("ebook_pending_orders").select("commerce_order, resources, discount_code"),
  ]);
  if (purchases.error || manifests.error) throw new Error("No se pudo leer la base para conciliar; no se escribió nada.");
  const compras = (purchases.data ?? []) as RecoveryPurchase[];
  const pending = new Map(((manifests.data ?? []) as RecoveryManifest[]).map((row) => [row.commerce_order, row]));
  const days: string[] = [];
  for (const day = new Date(`${PRIMERA_VENTA}T00:00:00Z`); day <= new Date(); day.setUTCDate(day.getUTCDate() + 1)) {
    days.push(day.toISOString().slice(0, 10));
  }
  const payments: RecoveryPayment[] = [];
  // Se completa toda la lectura antes de cualquier escritura o mensaje.
  for (let offset = 0; offset < days.length; offset += 8) {
    const batch = await Promise.all(days.slice(offset, offset + 8).map((date) => listPaidFlowPaymentsForDay(getFlowBase(), apiKey, secretKey, date)));
    payments.push(...batch.flat());
  }
  const unique = [...new Map(payments.map((payment) => [payment.flowOrder, payment])).values()];
  const plans = unique.map((payment) => ({ payment, plan: planEbookRecovery(payment, compras, pending.get(payment.commerceOrder)) }));
  const summary = { paid: unique.length, registered: 0, recoverable: 0, review: 0, ignored: 0 };
  for (const { payment, plan } of plans) {
    summary[plan.kind]++;
    if (plan.kind === "review") console.log(`REVISAR flowOrder ${payment.flowOrder}: ${plan.reason}`);
    if (plan.kind === "recoverable") console.log(`FALTAN flowOrder ${payment.flowOrder}: ${plan.items.map((item) => item.resource).join(", ")}`);
  }
  console.log(JSON.stringify(summary));
  console.log("Registrada significa que hay compras en la base; no verifica recepción de email ni descarga.");
  if (!aplicar) {
    console.log("(dry-run) Nada se escribió ni envió. Casos sin manifiesto o con descuento requieren revisión manual.");
    return;
  }
  for (const { payment, plan } of plans) {
    if (plan.kind !== "recoverable") continue;
    // El token autoriza descargas: nunca debe ser derivable del número de pago.
    const token = `recuperado-${randomBytes(32).toString("base64url")}`;
    // El adaptador Neon convierte el lote en una sola sentencia INSERT. Un
    // conflicto (por ejemplo con el webhook) revierte todas las filas del lote;
    // volver a ejecutar el diagnóstico permite conciliar el estado actual.
    const { error } = await db.from("ebook_purchases").insert(plan.items.map((item) => ({
        email: payment.payer, resource: item.resource, amount: item.amount, tier: item.tier,
        flow_order: payment.flowOrder, flow_token: token, discount_code: null,
    })));
    if (error) throw new Error(`Falló la recuperación de flowOrder ${payment.flowOrder}; vuelve a ejecutar el diagnóstico antes de reintentar.`);
    console.log(`REGISTRADA flowOrder ${payment.flowOrder}. Cupos y descuentos requieren conciliación manual.`);
    if (enviarEmail) {
      try {
        await sendEbookDeliveryEmail({ email: payment.payer!, grants: plan.items.map((item) => ({ resource: item.resource, token })), recovery: true });
      } catch {
        throw new Error(`Compra registrada para flowOrder ${payment.flowOrder}, pero el correo de recuperación falló. Usa /ebook/descargar; repetir --aplicar no reenvía compras registradas.`);
      }
      console.log(`EMAIL aceptado por Resend para flowOrder ${payment.flowOrder}.`);
      try {
        await sendPurchaseNotification({ kind: "Ebook", buyerEmail: payment.payer!, amount: Number(payment.amount), orderId: payment.commerceOrder, items: plan.items.map((item) => item.resource) });
      } catch {
        throw new Error(`Compra registrada y correo aceptado para flowOrder ${payment.flowOrder}, pero la notificación interna falló.`);
      }
    }
  }
  console.log("Si un correo falla después de registrar la compra, usa la recuperación por email; repetir --aplicar no reenvía compras ya registradas.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  recoverDeliveries(process.argv.slice(2)).catch((error) => {
    console.error("Conciliación incompleta:", error instanceof Error ? error.message : "Error desconocido.");
    process.exitCode = 1;
  });
}
