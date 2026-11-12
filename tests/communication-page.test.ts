import { afterEach, beforeEach, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/admin-communication-simulation", () => ({ loadCommunicationSimulation: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { loadCommunicationSimulation } from "@/lib/admin-communication-simulation";
import Page from "@/app/admin/comunicaciones/page";
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("React", React); vi.mocked(requireAdminSession).mockResolvedValue(undefined); });
afterEach(() => vi.unstubAllGlobals());
it("keeps auth redirect outside error rendering", async () => {
  vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect")); await expect(Page()).rejects.toThrow("redirect"); expect(loadCommunicationSimulation).not.toHaveBeenCalled();
});
it("does not leak query errors or display zero", async () => {
  vi.mocked(loadCommunicationSimulation).mockRejectedValue(new Error("private@email.test secret"));
  const html = renderToStaticMarkup(await Page()); expect(html).toContain("Consulta no disponible"); expect(html).not.toContain("private@"); expect(html).not.toContain("Candidatos: 0");
});
it.each(["absent", "partial", "complete"] as const)("renders readonly %s state with overlapping reason explanation", async schema => {
  vi.mocked(loadCommunicationSimulation).mockResolvedValue({ schema, missingSources: ["launch_notice"], canSend: false,
    cohorts: [{ purpose: "newsletter", total: 2, excluded: 2, pending: 0, reasons: { consent_unknown: 2, campaign_not_configured: 2 } }] });
  const html = renderToStaticMarkup(await Page()); expect(html).toContain("No se crean ni envían mensajes");
  expect(html).toContain("Candidatos: 2"); expect(html).toContain("Los motivos pueden coincidir"); expect(html).toContain("Faltan fuentes");
  expect(html).not.toContain("<form"); expect(html).not.toContain("<button");
  if (schema === "absent") expect(html).toContain("no instalado");
  if (schema === "partial") expect(html).toContain("parcialmente instalado");
});
