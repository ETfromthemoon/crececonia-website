import { describe, expect, it } from "vitest";
import { buildNotice, planNotices, validateEdition } from "../lib/ebook-edition-notice";

const edition = validateEdition({
  id: "2026-12-revision",
  subjectSingular: "Tu libro cambió",
  subjectPlural: "Tus libros cambiaron",
  intro: "Una nueva edición está lista.",
  books: [
    { resource: "ebook:de-cero-a-claude-en-una-semana", change: "Capítulo nuevo", sha256: { a4: "a".repeat(64), movil: "b".repeat(64) } },
    { resource: "ebook:agentes-de-ia", change: "Ejercicios nuevos", sha256: { a4: "c".repeat(64), movil: "d".repeat(64) } },
  ],
});

describe("avisos de ediciones reutilizables", () => {
  it("rechaza manifiestos con huellas incorrectas o libros repetidos", () => {
    expect(() => validateEdition({ ...edition, books: [{ ...edition.books[0], sha256: { a4: "123", movil: "b".repeat(64) } }] })).toThrow();
    expect(() => validateEdition({ ...edition, books: [edition.books[0], edition.books[0]] })).toThrow();
  });

  it("agrupa por comprador y solo incluye los libros de esta edición que compró", () => {
    const notices = planNotices([
      { email: "Ana@Example.com", resource: edition.books[0].resource, flow_token: "old", purchased_at: "2026-01-01" },
      { email: "ana@example.com", resource: edition.books[0].resource, flow_token: "new", purchased_at: "2026-11-01" },
      { email: "ana@example.com", resource: edition.books[1].resource, flow_token: "agents", purchased_at: "2026-10-01" },
      { email: "beto@example.com", resource: "ebook:claude-nivel-experto", flow_token: "other", purchased_at: "2026-10-01" },
    ], edition);
    expect(notices).toEqual([{ email: "ana@example.com", grants: [{ resource: edition.books[0].resource, token: "new" }, { resource: edition.books[1].resource, token: "agents" }] }]);
    const email = buildNotice(edition, notices[0]);
    expect(email.subject).toBe("Tus libros cambiaron");
    expect(email.html).toContain("format=a4");
    expect(email.html).not.toContain("Claude a Nivel Experto");
  });

  it("escapa el texto del manifiesto y ofrece recuperación si no hay token", () => {
    const copy = { ...edition, intro: "<script>alert(1)</script>" };
    const email = buildNotice(copy, { email: "a@example.com", grants: [{ resource: edition.books[0].resource, token: null }] });
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("/ebook/descargar");
    expect(email.html).not.toContain("format=a4");
  });
});
