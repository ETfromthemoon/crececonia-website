import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "./supabase";
import { sendWorkshopRecoveryEmail } from "./workshop-recovery-email";
import { WORKSHOP_PRODUCT_KEY } from "./workshop-product";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";
type ClaimedRecovery = { recovery_id: string; email: string; original_amount: number; discounted_amount: number };

export const hashWorkshopRecoveryToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function deliverWorkshopCheckoutRecoveries() {
  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("claim_workshop_checkout_recoveries", { p_product_key: WORKSHOP_PRODUCT_KEY });
  if (error) throw new Error(`No se pudieron preparar las recuperaciones: ${error.message}`);
  let sentCount = 0;
  let failedCount = 0;

  for (const recovery of (data ?? []) as ClaimedRecovery[]) {
    const token = randomBytes(32).toString("base64url");
    const recoveryUrl = `${SITE_URL}/api/workshop/recover?token=${encodeURIComponent(token)}`;
    try {
      const providerMessageId = await sendWorkshopRecoveryEmail({
        email: recovery.email,
        originalAmount: recovery.original_amount,
        discountedAmount: recovery.discounted_amount,
        recoveryUrl,
      });
      const { error: completeError } = await db.rpc("complete_workshop_checkout_recovery", {
        p_recovery_id: recovery.recovery_id,
        p_token_hash: hashWorkshopRecoveryToken(token),
        p_provider_message_id: providerMessageId,
      });
      if (completeError) throw new Error(completeError.message);
      sentCount += 1;
    } catch (reason) {
      failedCount += 1;
      const message = reason instanceof Error ? reason.message : "Error desconocido";
      await db.rpc("fail_workshop_checkout_recovery", { p_recovery_id: recovery.recovery_id, p_error: message.slice(0, 500) });
    }
  }

  return { sentCount, failedCount };
}
