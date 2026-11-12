import { afterEach, beforeEach, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn(), hasAdminSession: vi.fn() }));
vi.mock("@/lib/database", () => ({ queryDatabase: vi.fn() }));
import { requireAdminSession, hasAdminSession } from "@/lib/admin-auth";
import { queryDatabase } from "@/lib/database";
import QualificationsPage from "@/app/admin/postulaciones/page";
import AdminLayout from "@/app/admin/layout";

beforeEach(() => {
  vi.resetAllMocks();
  // Vitest's JSX transform uses the classic runtime; Next uses its own transform.
  vi.stubGlobal("React", React);
  vi.mocked(requireAdminSession).mockResolvedValue(undefined);
});
afterEach(() => { vi.unstubAllGlobals(); });

it("does not render or query private data before session authentication", async () => {
  vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
  await expect(QualificationsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect");
  expect(queryDatabase).not.toHaveBeenCalled();
});

it("renders a database failure visibly instead of an empty inbox or private error", async () => {
  vi.mocked(queryDatabase).mockRejectedValue(new Error("secret connection parameters"));
  const html = renderToStaticMarkup(await QualificationsPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Consulta no disponible");
  expect(html).not.toContain("No hay postulaciones");
  expect(html).not.toContain("secret connection parameters");
});

it("renders the absent integration separately from a genuinely empty page", async () => {
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: false }]).mockResolvedValueOnce([]);
  const html = renderToStaticMarkup(await QualificationsPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("Integración no instalada");
  expect(html).toContain("No hay postulaciones en esta página");
});

it("escapes contact values and keeps email/private answers out of list links", async () => {
  const id = "964c3f74-192f-4b17-845a-7f7bf0b0c909";
  const row = { id, service: "mentoria", name: "<script>alert(1)</script>", company: "Empresa", created_at: "2026-11-12T17:00:00.123456Z", status: "new", sync_status: null, attempts: null };
  vi.mocked(queryDatabase).mockResolvedValueOnce([{ installed: false }]).mockResolvedValueOnce([row])
    .mockResolvedValueOnce([{ ...row, email: "private@example.com", result: "<img src=x onerror=alert(1)>" }]);
  const html = renderToStaticMarkup(await QualificationsPage({ searchParams: Promise.resolve({ id }) }));
  expect(html).not.toContain("<script>alert(1)</script>");
  expect(html).not.toContain("<img src=x");
  expect(html).toContain("private@example.com");
  const links = html.match(/href="[^"]*"/g) ?? [];
  expect(links.join(" ")).not.toMatch(/private|script|alert|onerror/);
  expect(html).not.toMatch(/lease_token|worker_id/);
});

it("shows the inbox navigation only for an authenticated admin", async () => {
  vi.mocked(hasAdminSession).mockResolvedValue(false);
  expect(renderToStaticMarkup(await AdminLayout({ children: null }))).not.toContain('href="/admin/postulaciones"');
  vi.mocked(hasAdminSession).mockResolvedValue(true);
  expect(renderToStaticMarkup(await AdminLayout({ children: null }))).toContain('href="/admin/postulaciones"');
});
