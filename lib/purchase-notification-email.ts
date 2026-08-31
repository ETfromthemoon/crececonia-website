import { Resend } from "resend";

const DEFAULT_RECIPIENT = "sergio.bkg@gmail.com";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  }[character] ?? character));
}

export async function sendPurchaseNotification({
  kind,
  buyerEmail,
  amount,
  orderId,
  items,
}: {
  kind: "Clase en vivo" | "Workshop en vivo" | "Ebook";
  buyerEmail: string;
  amount: number;
  orderId: string;
  items: readonly string[];
}): Promise<void> {
  const recipient = process.env.PURCHASE_NOTIFICATION_EMAIL?.trim() || DEFAULT_RECIPIENT;
  const list = items.map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`).join("");

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: recipient,
    subject: `Nueva compra · ${kind} · $${amount.toLocaleString("es-CL")} CLP`,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;"><div style="max-width:560px;margin:0 auto;padding:48px 24px;"><p style="color:#D9B36A;font-size:11px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 28px;">CrececonIA · nueva compra</p><h1 style="font-size:25px;font-weight:400;line-height:1.3;margin:0 0 20px;">Se confirmó una compra</h1><div style="border:1px solid #2B2B2C;border-radius:18px;padding:22px;margin:0 0 24px;"><p style="margin:0 0 8px;">Tipo: <strong>${escapeHtml(kind)}</strong></p><p style="margin:0 0 8px;">Total: <strong>$${amount.toLocaleString("es-CL")} CLP</strong></p><p style="margin:0;">Comprador: <a href="mailto:${escapeHtml(buyerEmail)}" style="color:#D9B36A;">${escapeHtml(buyerEmail)}</a></p></div><p style="color:#A8A29E;margin:0 0 10px;">Incluye:</p><ul style="color:#F5F5F4;margin:0 0 28px;padding-left:20px;">${list}</ul><p style="color:#707074;font-size:12px;line-height:1.6;margin:0;">Orden: ${escapeHtml(orderId)}</p></div></body></html>`,
  });
}
