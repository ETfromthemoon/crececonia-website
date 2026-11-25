import { getCatalogEntry } from "./ebook-catalog";

export type Edition = {
  id: string;
  subjectSingular: string;
  subjectPlural: string;
  intro: string;
  books: { resource: string; change: string; sha256: { a4: string; movil: string } }[];
};
export type Purchase = { email: string | null; resource: string | null; flow_token: string | null; purchased_at: string | null };
export type Notice = { email: string; grants: { resource: string; token: string | null }[] };

export function validateEdition(value: unknown): Edition {
  if (!value || typeof value !== "object") throw new Error("Manifiesto inválido.");
  const e = value as Edition;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id ?? "") || !e.subjectSingular?.trim() || !e.subjectPlural?.trim() || !e.intro?.trim() || !Array.isArray(e.books) || !e.books.length) throw new Error("Faltan datos de la edición.");
  const seen = new Set<string>();
  for (const book of e.books) {
    if (!getCatalogEntry(book.resource) || seen.has(book.resource) || !book.change?.trim() || !/^[0-9a-f]{64}$/.test(book.sha256?.a4 ?? "") || !/^[0-9a-f]{64}$/.test(book.sha256?.movil ?? "")) throw new Error(`Libro o huellas inválidos: ${book.resource}`);
    seen.add(book.resource);
  }
  return e;
}

export function planNotices(rows: Purchase[], edition: Edition): Notice[] {
  const selected = new Set(edition.books.map((b) => b.resource));
  const buyers = new Map<string, Map<string, { token: string | null; at: string }>>();
  for (const row of rows) {
    const email = row.email?.trim().toLowerCase() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !row.resource || !selected.has(row.resource)) continue;
    const books = buyers.get(email) ?? new Map();
    const old = books.get(row.resource);
    const at = row.purchased_at ?? "";
    if (!old || (row.flow_token && (!old.token || at > old.at))) books.set(row.resource, { token: row.flow_token, at });
    buyers.set(email, books);
  }
  return [...buyers].map(([email, books]) => ({ email, grants: edition.books.filter((b) => books.has(b.resource)).map((b) => ({ resource: b.resource, token: books.get(b.resource)!.token })) })).sort((a, b) => a.email.localeCompare(b.email));
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function buildNotice(edition: Edition, notice: Notice, to = notice.email) {
  const site = "https://www.crececonia.cl";
  const blocks = notice.grants.map((grant) => {
    const book = edition.books.find((b) => b.resource === grant.resource)!;
    const title = getCatalogEntry(grant.resource)!.title;
    const base = grant.token ? `${site}/api/ebook/download?token=${encodeURIComponent(grant.token)}&resource=${encodeURIComponent(grant.resource)}` : `${site}/ebook/descargar`;
    return `<h2>${escape(title)}</h2><p>${escape(book.change)}</p><p><a href="${escape(base)}">Descargar edición móvil</a>${grant.token ? ` · <a href="${escape(base)}&amp;format=a4">Descargar A4</a>` : ""}</p>`;
  }).join("");
  return { from: "CrececonIA <sergio@crececonia.cl>", to, subject: notice.grants.length === 1 ? edition.subjectSingular : edition.subjectPlural, html: `<!doctype html><html lang="es"><meta charset="utf-8"><body><h1>Nueva edición de tus ebooks</h1><p>${escape(edition.intro)}</p>${blocks}<p>Si un enlace no funciona, recuperalo en <a href="${site}/ebook/descargar">crececonia.cl/ebook/descargar</a> o responde este correo.</p><p>Sergio · CrececonIA · Strimo SPA · Santiago, Chile</p></body></html>` };
}
