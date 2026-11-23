/** Conciliación de solo lectura por defecto. --aplicar y --enviar-email son explícitos. */
import { getSupabaseAdmin } from "../lib/supabase";
import { getFlowBase } from "../lib/flow";
import { listPaidFlowPaymentsForDay, planEbookRecovery, type RecoveryManifest, type RecoveryPayment, type RecoveryPurchase } from "../lib/ebook-recovery";
import { neon } from "@neondatabase/serverless";
import { finalizeEbookPaymentWithQuery, isEbookFinalizationEnabled, type FinalizationQuery } from "../lib/ebook-payment-finalization-core";
import { pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";

const PRIMERA_VENTA = "2026-06-18";

export async function recoverDeliveries(args: string[] = []) {
  const aplicar = args.includes("--aplicar");
  const enviarEmail = args.includes("--enviar-email");
  if (enviarEmail && !aplicar) throw new Error("--enviar-email requiere --aplicar.");
  if (aplicar && !isEbookFinalizationEnabled()) throw new Error("--aplicar requiere el corte coordinado y EBOOK_PAYMENT_FINALIZATION_ENABLED=true.");
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
  const client = neon(process.env.DATABASE_URL!);
  const databaseQuery: FinalizationQuery = async <T extends Record<string, unknown>>(sql: string, values: unknown[]) => {
    const response = await client.query(sql, values, { fullResults: true });
    return (response.rows ?? []) as T[];
  };
  if (enviarEmail) console.log("--enviar-email no envía directamente: las recuperaciones quedan en revisión en el outbox.");
  for (const { payment, plan } of plans) {
    if (plan.kind !== "recoverable") continue;
    const token = `recuperado-${randomBytes(32).toString("base64url")}`;
    try {
      await finalizeEbookPaymentWithQuery(databaseQuery, {
        flowOrder: String(payment.flowOrder), commerceOrder: payment.commerceOrder,
        email: payment.payer!, amount: Number(payment.amount), token, source: "recovery",
      });
    } catch {
      throw new Error(`Falló la finalización de flowOrder ${payment.flowOrder}; no se intentó escritura legacy ni envío.`);
    }
    console.log(`FINALIZADA flowOrder ${payment.flowOrder}; revisar estado durable del outbox antes de cualquier envío.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  recoverDeliveries(process.argv.slice(2)).catch((error) => {
    console.error("Conciliación incompleta:", error instanceof Error ? error.message : "Error desconocido.");
    process.exitCode = 1;
  });
}
