import { getSupabaseAdmin } from "./supabase";
import { sendClassAccessEmail, sendClassOrganizerReminder, sendClassSessionEmail } from "./class-delivery-email";
import { sendEbookDeliveryEmail } from "./ebook-delivery-email";

export type ClassDeliveryKind = "welcome" | "ebooks" | "session-1h" | "session-10m";

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
      } else if (kind === "ebooks") {
        const { data: grants, error: grantsError } = await db.rpc("grant_class_ebook_delivery", {
          p_commerce_order: delivery.commerce_order,
        });
        if (grantsError) throw new Error(grantsError.message);
        await sendEbookDeliveryEmail({ email: delivery.email, grants: grants ?? [] });
      } else {
        await sendClassSessionEmail({ email: delivery.email, timing: kind === "session-1h" ? "1h" : "10m" });
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
