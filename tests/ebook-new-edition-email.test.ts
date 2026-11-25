import { describe, expect, it } from "vitest";
import {
  NEW_EDITION_CHANGES,
  buildNewEditionEmail,
  newEditionDownloadUrl,
  newEditionIdempotencyKey,
  planNewEditionNotices,
} from "@/lib/ebook-new-edition-email";
import { getActiveCatalogEntries } from "@/lib/ebook-catalog";

const DE_CERO = "ebook:de-cero-a-claude-en-una-semana";
const AGENTES = "ebook:agentes-de-ia";

describe("planNewEditionNotices", () => {
  it("agrupa por email sin distinguir mayúsculas: un correo por persona", () => {
    const plan = planNewEditionNotices([
      { email: "Ana@Example.test", resource: DE_CERO, flow_token: "t1", purchased_at: "2026-07-01" },
      { email: " ana@example.test ", resource: AGENTES, flow_token: "t2", purchased_at: "2026-08-01" },
      { email: "beto@example.test", resource: AGENTES, flow_token: "t3", purchased_at: "2026-08-02" },
    ]);
    expect(plan.notices.map((n) => n.email)).toEqual(["ana@example.test", "beto@example.test"]);
    expect(plan.notices[0].grants).toEqual([
      { resource: DE_CERO, token: "t1" },
      { resource: AGENTES, token: "t2" },
    ]);
  });

  it("si compró dos veces el mismo libro, usa el token de la compra más reciente", () => {
    const plan = planNewEditionNotices([
      { email: "ana@example.test", resource: DE_CERO, flow_token: "viejo", purchased_at: "2026-06-20" },
      { email: "ana@example.test", resource: DE_CERO, flow_token: "nuevo", purchased_at: "2026-09-01" },
    ]);
    expect(plan.notices[0].grants).toEqual([{ resource: DE_CERO, token: "nuevo" }]);
  });

  it("prefiere una fila con token frente a una recuperada sin token", () => {
    const plan = planNewEditionNotices([
      { email: "ana@example.test", resource: DE_CERO, flow_token: null, purchased_at: "2026-10-01" },
      { email: "ana@example.test", resource: DE_CERO, flow_token: "real", purchased_at: "2026-06-20" },
    ]);
    expect(plan.notices[0].grants[0].token).toBe("real");
  });

  it("omite emails inválidos y libros desconocidos, y lo informa", () => {
    const plan = planNewEditionNotices([
      { email: null, resource: DE_CERO, flow_token: "t" },
      { email: "sin-arroba", resource: DE_CERO, flow_token: "t" },
      { email: "ana@example.test", resource: "ebook:no-existe", flow_token: "t" },
    ]);
    expect(plan.notices).toEqual([]);
    expect(plan.skipped).toEqual([
      { reason: "email inválido o vacío", count: 2 },
      { reason: "libro sin nueva edición o inactivo", count: 1 },
    ]);
  });
});

describe("contenido del aviso", () => {
  it("cubre todos los libros activos del catálogo", () => {
    for (const entry of getActiveCatalogEntries()) {
      expect(NEW_EDITION_CHANGES[entry.resource], entry.resource).toBeTruthy();
    }
  });

  it("usa el enlace directo con token, o la recuperación si no hay token", () => {
    expect(newEditionDownloadUrl({ resource: DE_CERO, token: "a b" })).toMatch(
      /\/api\/ebook\/download\?token=a%20b&resource=ebook%3Ade-cero-a-claude-en-una-semana$/,
    );
    expect(newEditionDownloadUrl({ resource: DE_CERO, token: null })).toMatch(/\/ebook\/descargar$/);
  });

  it("arma un correo por persona con un bloque y enlace A4 por libro", () => {
    const email = buildNewEditionEmail({
      email: "ana@example.test",
      grants: [{ resource: DE_CERO, token: "t1" }, { resource: AGENTES, token: "t2" }],
    });
    expect(email.to).toBe("ana@example.test");
    expect(email.subject).toContain("tus ebooks");
    expect(email.html).toContain("De cero a Claude en una semana");
    expect(email.html).toContain("Agentes de IA para tu Negocio");
    expect(email.html.match(/Descargar nueva edición/g)).toHaveLength(2);
    expect(email.html.match(/format=a4/g)).toHaveLength(2);
  });

  it("singular cuando es un solo libro y rechaza avisos vacíos", () => {
    expect(buildNewEditionEmail({ email: "a@b.cl", grants: [{ resource: DE_CERO, token: "t" }] }).subject)
      .toContain("tu ebook");
    expect(() => buildNewEditionEmail({ email: "a@b.cl", grants: [] })).toThrow();
  });

  it("la clave de idempotencia es estable por persona y campaña", () => {
    expect(newEditionIdempotencyKey(" Ana@Example.test ")).toBe(newEditionIdempotencyKey("ana@example.test"));
  });
});
