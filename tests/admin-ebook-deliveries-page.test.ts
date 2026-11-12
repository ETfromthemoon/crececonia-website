import { afterEach, beforeEach, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn(), hasAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession, hasAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import Page from "@/app/admin/ebook/entregas/page";
import Layout from "@/app/admin/layout";
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("React", React); vi.mocked(requireAdminSession).mockResolvedValue(undefined); });
afterEach(() => vi.unstubAllGlobals());
const render = async (params = {}) => renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) }));
it("keeps auth redirect outside catch and before DB", async () => {
  vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect")); await expect(render()).rejects.toThrow("redirect"); expect(queryDatabase).not.toHaveBeenCalled();
});
it("shows query errors without leaking private error or claiming empty", async () => {
  vi.mocked(queryDatabase).mockRejectedValue(new Error("email token connection-secret")); const html = await render();
  expect(html).toContain("Consulta no disponible"); expect(html).not.toContain("connection-secret"); expect(html).not.toContain("No hay trabajos");
});
it.each([[false, false, false, "no instalada"], [false, true, false, "parcialmente instalada"]])("shows absent/partial schema explicitly", async (jobs, receipts, effects, text) => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ jobs, receipts, effects, now: new Date() }]); const html = await render();
  expect(html).toContain(text); expect(html).not.toContain("No hay trabajos");
});
it("rejects repeated cursors without DB", async () => {
  const html = await render({ cursor: ["one", "two"] }); expect(html).toContain("paginación no es válido"); expect(queryDatabase).not.toHaveBeenCalled();
});
it("only exposes navigation to signed-in admins", async () => {
  vi.mocked(hasAdminSession).mockResolvedValue(false); expect(renderToStaticMarkup(await Layout({ children: null }))).not.toContain('/admin/ebook/entregas');
  vi.mocked(hasAdminSession).mockResolvedValue(true); expect(renderToStaticMarkup(await Layout({ children: null }))).toContain('/admin/ebook/entregas');
});
it("renders acceptance and financial incidents separately without secrets or mutation controls", async () => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ jobs: true, receipts: true, effects: true, now: new Date() }]).mockResolvedValueOnce([{
    id: "964c3f74-192f-4b17-845a-7f7bf0b0c909", flow_order: "99", created_at: "2026-11-12T17:00:00.123456Z", status: "provider_accepted", attempts: 1,
    first_attempt_at: new Date(), lease_expires_at: null, next_attempt_at: new Date(), provider_accepted_at: new Date(), last_error_code: null,
    receipt_recorded: true, effects_applied: 0, effects_review: 2, payload: "private-link", buyer_email: "private@example.test", lease_token: "private-token",
    incidents: [{ kind: "discount", resource: "", reason: "discount_unavailable" }, { kind: "delivery", resource: "", reason: "recovery_delivery_requires_review" }],
  }]);
  const html = await render(); expect(html).toContain("Aceptado por el proveedor"); expect(html).toContain("Incidencias pendientes: 2");
  expect(html).not.toContain("private-"); expect(html).not.toContain("private@example.test"); expect(html).not.toContain("<form"); expect(html).not.toContain("<button");
  expect(html).toContain("Descuento no canjeable"); expect(html).toContain("Entrega recuperada pendiente de revisión");
});
