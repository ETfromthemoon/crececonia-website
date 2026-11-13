/** Pure marketplace post-sale decisions. The payment transaction owns the outbox. */
export type PostSaleKind = "purchase-access" | "access-recovery" | "review-invitation";

export type PostSaleEvent = {
  kind: PostSaleKind;
  orderId: string;
  recoveryRequestId?: string;
  buyerEmail: string;
  bookTitle: string;
  authorName: string;
  recipientVerified: boolean;
  entitlementActive: boolean;
  marketingConsent: boolean;
  optedOut: boolean;
  purchasedAt: Date;
  libraryUrl: string;
  preferenceUrl?: string;
};

export type PostSaleMessage = {
  eventKey: string;
  to: string;
  subject: string;
  text: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = "https://www.crececonia.cl";

function safeSiteUrl(value: string): string {
  const url = new URL(value);
  if (url.origin !== SITE || url.username || url.password || url.hash || url.search) throw new Error("URL de posventa no autorizada.");
  return url.toString();
}

function safeCopy(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 180);
}

/** Stable unique key for an outbox row. Never use this as an access token. */
export function postSaleEventKey(kind: PostSaleKind, orderId: string, recoveryRequestId?: string): string {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(orderId)) throw new Error("Identificador de orden inválido.");
  if (kind === "access-recovery") {
    if (!recoveryRequestId || !/^[a-zA-Z0-9_-]{1,100}$/.test(recoveryRequestId)) throw new Error("Solicitud de recuperación inválida.");
    return `marketplace:${orderId}:${kind}:${recoveryRequestId}`;
  }
  return `marketplace:${orderId}:${kind}`;
}

export function buildPostSaleMessage(event: PostSaleEvent, now: Date): PostSaleMessage | null {
  if (!EMAIL.test(event.buyerEmail) || !Number.isFinite(event.purchasedAt.getTime()) || !Number.isFinite(now.getTime())) {
    throw new Error("Datos de posventa inválidos.");
  }
  if (!event.entitlementActive) return null;
  if (event.kind === "access-recovery" && !event.recipientVerified) return null;
  if (event.kind === "review-invitation") {
    // A purchase does not grant permission to send marketing or review requests.
    if (!event.recipientVerified || !event.marketingConsent || event.optedOut || !event.preferenceUrl) return null;
    if (now.getTime() - event.purchasedAt.getTime() < 14 * 24 * 60 * 60 * 1000) return null;
  }

  const title = safeCopy(event.bookTitle);
  const author = safeCopy(event.authorName);
  if (!title || !author) throw new Error("El libro y el autor son obligatorios.");
  const book = `«${title}», de ${author}`;
  const library = safeSiteUrl(event.libraryUrl);
  const support = "mailto:sergio@crececonia.cl";
  const preference = event.preferenceUrl ? safeSiteUrl(event.preferenceUrl) : "";
  const copy: Record<PostSaleKind, { subject: string; text: string }> = {
    "purchase-access": {
      subject: `Tu compra de ${title}`,
      text: `Gracias por comprar ${book}. Tu acceso está en tu biblioteca: ${library}\n\nSi necesitas ayuda: ${support}`,
    },
    "access-recovery": {
      subject: `Recupera tu acceso a ${title}`,
      text: `Tu libro ${book} sigue disponible en tu biblioteca: ${library}\n\nInicia sesión con el correo verificado de compra. Si necesitas ayuda: ${support}`,
    },
    "review-invitation": {
      subject: `¿Cómo te fue con ${title}?`,
      text: `Si ya leíste ${book}, puedes dejar una opinión desde tu biblioteca: ${library}\n\nDeja de recibir invitaciones y novedades en ${preference}`,
    },
  };
  return { eventKey: postSaleEventKey(event.kind, event.orderId, event.recoveryRequestId), to: event.buyerEmail, ...copy[event.kind] };
}
