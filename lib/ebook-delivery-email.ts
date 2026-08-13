import { Resend } from "resend";
import { getCatalogEntry } from "./ebook-catalog";

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";

export type EbookDownloadGrant = {
  resource: string;
  token: string;
};

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function uniqueGrants(grants: readonly EbookDownloadGrant[]): EbookDownloadGrant[] {
  const seen = new Set<string>();
  return grants.filter((grant) => {
    const key = `${grant.token}:${grant.resource}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function downloadLinkHtml(grant: EbookDownloadGrant): string {
  const title = getCatalogEntry(grant.resource)?.title ?? grant.resource;
  const href = `${SITE_URL}/api/ebook/download?token=${encodeURIComponent(grant.token)}&resource=${encodeURIComponent(grant.resource)}`;
  return `<p style="margin:0 0 16px;"><strong style="color:#F5F5F4;">${title}</strong><br/><a href="${href}" style="color:#D9B36A;">Descargar →</a></p>`;
}

export async function sendEbookDeliveryEmail({
  email,
  grants,
  recovery = false,
}: {
  email: string;
  grants: readonly EbookDownloadGrant[];
  recovery?: boolean;
}): Promise<void> {
  const unique = uniqueGrants(grants);
  if (unique.length === 0) throw new Error("No hay ebooks para entregar.");

  const isBundle = unique.length > 1;
  const firstTitle = getCatalogEntry(unique[0].resource)?.title ?? "CrececonIA";
  const subject = recovery
    ? "Tus enlaces de descarga de CrececonIA"
    : isBundle
      ? "Tus ebooks de CrececonIA"
      : `Tu ebook: ${firstTitle}`;

  await getResend().emails.send({
    from: "CrececonIA <sergio@crececonia.cl>",
    to: email,
    subject,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;"><div style="max-width:560px;margin:0 auto;padding:48px 24px;"><p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Ebook</p><h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">${recovery ? "Tus enlaces están listos" : "¡Gracias por tu compra!"}</h1><p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">${isBundle ? "Usá cada enlace para descargar el ebook correspondiente." : "Tu ebook está listo para descargar."}</p>${unique.map(downloadLinkHtml).join("")}<p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:24px 0 40px;">Estos enlaces entregan solamente los ebooks de esta compra. Si necesitás reenviarlos, pedilos en <a href="${SITE_URL}/ebook/descargar" style="color:#D9B36A;text-decoration:none;">${SITE_URL}/ebook/descargar</a>.</p><hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;"><p style="color:#8C8C8C;font-size:12px;margin:0;">CrececonIA · Strimo SPA · Santiago, Chile</p></div></body></html>`,
  });
}
