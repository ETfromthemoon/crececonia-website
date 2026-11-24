import { getActiveCatalogEntries, getCatalogEntry } from "./ebook-catalog";

/**
 * Aviso de nueva edición a quienes ya compraron un ebook.
 *
 * Funciones puras: el script `scripts/avisar-nueva-edicion.ts` lee las
 * compras, arma el plan con `planNewEditionNotices` y envía con Resend. Se
 * mantienen separadas para poder probar la agrupación y el contenido sin
 * tocar la base ni el proveedor de correo.
 */

const SITE_URL = process.env.SITE_URL ?? "https://www.crececonia.cl";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Identifica esta campaña: forma parte de la clave de idempotencia y del registro local. */
export const NEW_EDITION_ID = "2026-11-app-escritorio";

export type PurchaseRow = {
  email: string | null;
  resource: string | null;
  flow_token: string | null;
  purchased_at?: string | null;
};

export type NewEditionGrant = { resource: string; token: string | null };
export type NewEditionNotice = { email: string; grants: NewEditionGrant[] };
export type NewEditionPlan = { notices: NewEditionNotice[]; skipped: { reason: string; count: number }[] };

/** Qué trae de nuevo cada libro en esta edición. Solo los libros listados aquí se avisan. */
export const NEW_EDITION_CHANGES: Record<string, string> = {
  "ebook:de-cero-a-claude-en-una-semana":
    "Capítulo nuevo «Claude Code sin terminal» (la pestaña Code de la app de escritorio), recuadros con el equivalente en la app en todo el Nivel 3, el plan Ultra y Cowork con tareas programadas.",
  "ebook:claude-nivel-experto":
    "Cómo orquestar, verificar y dejar procesos corriendo solos desde la app de escritorio, y la guía «qué usar para qué» actualizada con la pestaña Code y la nube.",
  "ebook:agentes-de-ia":
    "Capítulo nuevo 11B «Tu agente en el escritorio: Cowork y tareas programadas» y el paso a paso en el Anexo G.8.",
  "ebook:creacion-de-webs-con-ia":
    "Capítulo nuevo 1b «Setup en Claude Desktop» y recuadros de la app en testing, iteraciones y deploy.",
  "ebook:creacion-de-webs-con-ia-parte-2":
    "Capítulo nuevo 1b «Setup en Claude Desktop» y recuadros de la app en testing, iteraciones y deploy.",
  "ebook:creacion-de-webs-con-ia-parte-3":
    "Capítulo nuevo 1b «Setup en Claude Desktop» y recuadros de la app en testing, iteraciones y deploy.",
  "ebook:creacion-de-webs-con-ia-parte-4":
    "Capítulo nuevo 1b «Setup en Claude Desktop» y recuadros de la app en testing, iteraciones y deploy.",
};

function bump(skipped: Map<string, number>, reason: string): void {
  skipped.set(reason, (skipped.get(reason) ?? 0) + 1);
}

/**
 * Agrupa las compras por email (sin distinguir mayúsculas) para mandar UN
 * correo por persona con todos sus libros actualizados. Si alguien compró el
 * mismo libro dos veces, se queda con el token de la compra más reciente.
 */
export function planNewEditionNotices(rows: readonly PurchaseRow[]): NewEditionPlan {
  const active = new Set(getActiveCatalogEntries().map((entry) => entry.resource));
  const skipped = new Map<string, number>();
  const byEmail = new Map<string, Map<string, { token: string | null; at: string }>>();

  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() ?? "";
    const resource = row.resource ?? "";
    if (!EMAIL_PATTERN.test(email)) { bump(skipped, "email inválido o vacío"); continue; }
    if (!NEW_EDITION_CHANGES[resource] || !active.has(resource)) { bump(skipped, "libro sin nueva edición o inactivo"); continue; }
    const books = byEmail.get(email) ?? new Map();
    const previous = books.get(resource);
    const at = row.purchased_at ?? "";
    if (!previous || (row.flow_token && (!previous.token || at > previous.at))) {
      books.set(resource, { token: row.flow_token || null, at });
    }
    byEmail.set(email, books);
  }

  const order = getActiveCatalogEntries().map((entry) => entry.resource);
  const notices = [...byEmail.entries()]
    .map(([email, books]) => ({
      email,
      grants: [...books.entries()]
        .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
        .map(([resource, { token }]) => ({ resource, token })),
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return { notices, skipped: [...skipped.entries()].map(([reason, count]) => ({ reason, count })) };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Enlace directo si hay token de compra; si no, la página de recuperación por email. */
export function newEditionDownloadUrl(grant: NewEditionGrant): string {
  if (!grant.token) return `${SITE_URL}/ebook/descargar`;
  return `${SITE_URL}/api/ebook/download?token=${encodeURIComponent(grant.token)}&resource=${encodeURIComponent(grant.resource)}`;
}

function bookBlock(grant: NewEditionGrant): string {
  const title = escapeHtml(getCatalogEntry(grant.resource)?.title ?? grant.resource);
  const change = escapeHtml(NEW_EDITION_CHANGES[grant.resource] ?? "");
  const href = escapeHtml(newEditionDownloadUrl(grant));
  const a4 = grant.token ? ` · <a href="${href}&amp;format=a4" style="color:#D9B36A;">versión A4 →</a>` : "";
  return `<div style="margin:0 0 24px;padding:16px 18px;border:1px solid #1E1E1F;border-radius:4px;"><p style="margin:0 0 6px;"><strong style="color:#F5F5F4;">${title}</strong></p><p style="color:#A8A29E;font-size:14px;line-height:1.6;margin:0 0 10px;">${change}</p><p style="margin:0;font-size:14px;"><a href="${href}" style="color:#D9B36A;">Descargar nueva edición →</a>${a4}</p></div>`;
}

export function buildNewEditionEmail(notice: NewEditionNotice) {
  if (notice.grants.length === 0) throw new Error("No hay libros para avisar.");
  const plural = notice.grants.length > 1;
  return {
    from: "CrececonIA <sergio@crececonia.cl>",
    to: notice.email,
    subject: plural
      ? "Nueva edición de tus ebooks: ahora con la app de escritorio de Claude"
      : "Nueva edición de tu ebook: ahora con la app de escritorio de Claude",
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#0A0A0B;color:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;"><div style="max-width:560px;margin:0 auto;padding:48px 24px;"><p style="color:#D9B36A;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 40px;">CrececonIA · Nueva edición</p><h1 style="font-size:22px;font-weight:300;margin:0 0 16px;line-height:1.4;">${plural ? "Tus ebooks tienen una edición nueva" : "Tu ebook tiene una edición nueva"}</h1><p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 16px;">Claude cambió mucho este año: la app de escritorio ahora trae Claude Code con botones, Cowork para trabajar con tus archivos y tareas que corren solas. Actualicé ${plural ? "los libros que compraste" : "el libro que compraste"} para que lo aprovechés desde el primer día.</p><p style="color:#A8A29E;font-size:15px;line-height:1.7;margin:0 0 32px;">Es gratis para vos, por haberlo comprado. Esto es lo nuevo:</p>${notice.grants.map(bookBlock).join("")}<p style="color:#8C8C8C;font-size:13px;line-height:1.7;margin:24px 0 40px;">Los enlaces funcionan con tu compra original. Si alguno no abre, pedí uno nuevo en <a href="${SITE_URL}/ebook/descargar" style="color:#D9B36A;text-decoration:none;">${SITE_URL}/ebook/descargar</a> con este mismo email, o respondé este correo y lo resuelvo.</p><hr style="border:none;border-top:1px solid #1E1E1F;margin:0 0 24px;"><p style="color:#8C8C8C;font-size:12px;margin:0;">Sergio · CrececonIA · Strimo SPA · Santiago, Chile<br/>Recibís este correo porque compraste ${plural ? "estos ebooks" : "este ebook"} en crececonia.cl.</p></div></body></html>`,
  };
}

/** Clave estable por persona y campaña: si el script se repite, Resend no duplica (24 h). */
export function newEditionIdempotencyKey(email: string): string {
  return `ebook-nueva-edicion/${NEW_EDITION_ID}/${email.trim().toLowerCase()}`;
}
