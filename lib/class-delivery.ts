import { getSupabaseAdmin } from "./supabase";
import { sendClassAccessEmail, sendClassFollowUpEmail, sendClassHubAccessEmail, sendClassOrganizerReminder, sendClassSessionEmail } from "./class-delivery-email";
import { sendEbookDeliveryEmail } from "./ebook-delivery-email";
import { CLASS_END, CLASS_START } from "./class-product";

export type ClassDeliveryKind = "welcome" | "hub" | "ebooks" | "session-1h" | "session-10m" | "session-late" | "follow-up";

type ClaimedDelivery = {
  event_id: string;
  commerce_order: string;
  email: string;
  offer_label: string;
  amount_minor: number;
  flow_token: string | null;
};

type DeliverySummary = { paid_count: number };

export async function deliverClassOrders(kind: ClassDeliveryKind, commerceOrder?: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("claim_class_delivery", {
    p_delivery_kind: kind,
    p_commerce_order: commerceOrder ?? null,
  });
  if (error) throw new Error(`No se pudo preparar la entrega ${kind}: ${error.message}`);

  let sentCount = 0;
  for (const delivery of (data ?? []) as ClaimedDelivery[]) {
    try {
      if (kind === "welcome") {
        await sendClassAccessEmail({
          email: delivery.email,
          offerLabel: delivery.offer_label,
          amount: delivery.amount_minor,
          orderId: delivery.commerce_order,
        });
      } else if (kind === "hub") {
        await sendClassHubAccessEmail({ email: delivery.email, orderId: delivery.commerce_order });
      } else if (kind === "ebooks") {
        const { data: grants, error: grantsError } = await db.rpc("grant_class_ebook_delivery", {
          p_commerce_order: delivery.commerce_order,
        });
        if (grantsError) throw new Error(grantsError.message);
        await sendEbookDeliveryEmail({ email: delivery.email, grants: grants ?? [] });
      } else if (kind === "follow-up") {
        await sendClassFollowUpEmail({ email: delivery.email, orderId: delivery.commerce_order });
      } else {
        const timing = kind === "session-1h" ? "1h" : kind === "session-10m" ? "10m" : "late";
        await sendClassSessionEmail({ email: delivery.email, timing });
      }
      const { error: completeError } = await db.rpc("complete_class_delivery", { p_event_id: delivery.event_id });
      if (completeError) throw new Error(completeError.message);
      sentCount += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      await db.rpc("fail_class_delivery", { p_event_id: delivery.event_id, p_error: message.slice(0, 500) });
      throw error;
    }
  }
  return { sentCount };
}

export async function deliverLateClassAccessIfNeeded(commerceOrder: string) {
  const now = Date.now();
  const oneHourBefore = Date.parse(CLASS_START) - 60 * 60 * 1000;
  const classEnd = Date.parse(CLASS_END);
  if (!process.env.CLASS_SESSION_URL?.trim() || now < oneHourBefore || now >= classEnd) return { sentCount: 0 };
  return deliverClassOrders("session-late", commerceOrder);
}

export async function getClassDeliverySummary(): Promise<DeliverySummary> {
  const { data, error } = await getSupabaseAdmin().rpc("class_delivery_summary");
  if (error) throw new Error(`No se pudo leer el resumen de la clase: ${error.message}`);
  return (data?.[0] ?? { paid_count: 0 }) as DeliverySummary;
}

export async function sendOrganizerChecklist(timing: "1h" | "10m" | "blocked", sentCount: number) {
  const summary = await getClassDeliverySummary();
  const sessionReady = Boolean(process.env.CLASS_SESSION_URL?.trim());
  await sendClassOrganizerReminder({ timing, paidCount: summary.paid_count, sentCount, sessionReady });
}
