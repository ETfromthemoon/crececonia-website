import "server-only";
import { sendEbookDeliveryEmail } from "./ebook-delivery-email";
import { getSupabaseAdmin } from "./supabase";
import { sendWorkshopFollowUpEmail, sendWorkshopSessionEmail, sendWorkshopWelcomeEmail } from "./workshop-delivery-email";
import { WORKSHOP_EBOOK_RESOURCES, WORKSHOP_END, WORKSHOP_PRODUCT_KEY, WORKSHOP_START } from "./workshop-product";

export type WorkshopDeliveryKind = "welcome" | "ebooks" | "session-1h" | "session-10m" | "session-late" | "follow-up";
type Claimed = { event_id: string; commerce_order: string; email: string; amount_minor: number };

export async function deliverWorkshopOrders(kind: WorkshopDeliveryKind, commerceOrder?: string) {
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("claim_workshop_delivery", { p_product_key: WORKSHOP_PRODUCT_KEY, p_delivery_kind: kind, p_commerce_order: commerceOrder ?? null });
  if (error) throw new Error(`No se pudo preparar ${kind}: ${error.message}`);
  let sentCount = 0;
  for (const delivery of (data ?? []) as Claimed[]) {
    try {
      let providerMessageId: string;
      if (kind === "welcome") providerMessageId = await sendWorkshopWelcomeEmail({ email: delivery.email, amount: delivery.amount_minor, orderId: delivery.commerce_order });
      else if (kind === "ebooks") {
        const { data: grants, error: grantsError } = await db.rpc("grant_workshop_ebooks", { p_commerce_order: delivery.commerce_order, p_resources: [...WORKSHOP_EBOOK_RESOURCES] });
        if (grantsError) throw new Error(grantsError.message);
        providerMessageId = await sendEbookDeliveryEmail({ email: delivery.email, grants: grants ?? [] });
      } else if (kind === "follow-up") providerMessageId = await sendWorkshopFollowUpEmail({ email: delivery.email, orderId: delivery.commerce_order });
      else providerMessageId = await sendWorkshopSessionEmail({ email: delivery.email, orderId: delivery.commerce_order, timing: kind === "session-1h" ? "1h" : kind === "session-10m" ? "10m" : "late" });
      const { error: completeError } = await db.rpc("complete_workshop_delivery", { p_event_id: delivery.event_id, p_provider_message_id: providerMessageId });
      if (completeError) throw new Error(completeError.message);
      sentCount += 1;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Error desconocido";
      await db.rpc("fail_class_delivery", { p_event_id: delivery.event_id, p_error: message.slice(0, 500) });
      throw reason;
    }
  }
  return { sentCount };
}

export async function deliverLateWorkshopAccessIfNeeded(commerceOrder: string) {
  const now = Date.now();
  if (now < Date.parse(WORKSHOP_START) - 60 * 60 * 1000 || now >= Date.parse(WORKSHOP_END)) return { sentCount: 0 };
  return deliverWorkshopOrders("session-late", commerceOrder);
}
