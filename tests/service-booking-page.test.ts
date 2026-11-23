import { afterEach, beforeEach, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdminSession: vi.fn() }));
vi.mock("@/lib/service-booking-config", () => ({ inspectBookingPreparation: vi.fn() }));
import { requireAdminSession } from "@/lib/admin-auth";
import { inspectBookingPreparation } from "@/lib/service-booking-config";
import Page from "@/app/admin/reservas/page";
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("React", React); });
afterEach(() => vi.unstubAllGlobals());
it("authenticates before reading booking configuration", async () => {
  vi.mocked(requireAdminSession).mockRejectedValue(new Error("redirect"));
  await expect(Page()).rejects.toThrow("redirect"); expect(inspectBookingPreparation).not.toHaveBeenCalled();
});
it("does not promise availability when all fields are configured", async () => {
  vi.mocked(inspectBookingPreparation).mockReturnValue({ state: "integration_pending", canBook: false, malformed: false, checks: [] });
  const html = renderToStaticMarkup(await Page());
  expect(html).toContain("integración pendiente"); expect(html).toContain("No se ofrecen horarios");
  expect(html).not.toContain("<form"); expect(html).not.toContain("<button");
});
it("shows invalid configuration as a correction requirement", async () => {
  vi.mocked(inspectBookingPreparation).mockReturnValue({ state: "configuration_pending", canBook: false, malformed: true, checks: [] });
  expect(renderToStaticMarkup(await Page())).toContain('role="alert"');
});
