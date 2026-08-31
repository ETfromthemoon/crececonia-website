import { Resend, type WebhookEventPayload } from "resend";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("Webhook no configurado.", { status: 503 });
  const payload = await request.text();
  let event: WebhookEventPayload;
  try {
    event = new Resend(process.env.RESEND_API_KEY).webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return new Response("Firma inválida.", { status: 401 });
  }
  if (!event.type.startsWith("email.")) return new Response("OK");
  const emailId = "email_id" in event.data ? event.data.email_id : null;
  if (!emailId) return new Response("OK");
  const { error } = await getSupabaseAdmin().rpc("record_workshop_email_event", {
    p_provider_message_id: emailId,
    p_event_type: event.type,
    p_event_at: event.created_at,
  });
  if (error) { console.error("[resend/webhook]", error.message); return new Response("RETRY", { status: 500 }); }
  return new Response("OK");
}
