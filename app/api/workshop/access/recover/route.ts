import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendWorkshopFollowUpEmail } from "@/lib/workshop-delivery-email";
import { WORKSHOP_PRODUCT_KEY } from "@/lib/workshop-product";

export const dynamic = "force-dynamic";

const genericMessage = "Si ese correo tiene una compra, enviaremos un nuevo enlace de acceso en unos minutos.";
const validEmail = (value: unknown): value is string => typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

type Recovery = { recovery_id: string; commerce_order: string; email: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!validEmail(email)) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db.rpc("claim_workshop_access_recovery", {
    p_product_key: WORKSHOP_PRODUCT_KEY,
    p_email: email,
  });
  const recovery = (data?.[0] ?? null) as Recovery | null;
  if (error || !recovery) return NextResponse.json({ message: genericMessage });

  try {
    const providerMessageId = await sendWorkshopFollowUpEmail({ email: recovery.email, orderId: recovery.commerce_order });
    await db.rpc("complete_workshop_access_recovery", {
      p_recovery_id: recovery.recovery_id,
      p_provider_message_id: providerMessageId,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Error desconocido";
    await db.rpc("fail_workshop_access_recovery", { p_recovery_id: recovery.recovery_id, p_error: message.slice(0, 500) });
    console.error("[workshop/access/recover]", message);
  }
  return NextResponse.json({ message: genericMessage });
}
