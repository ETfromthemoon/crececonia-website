import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAssets, mockSettings, mockList } = vi.hoisted(() => ({ mockAssets: vi.fn(), mockSettings: vi.fn(), mockList: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/workshop-asset-storage", () => ({ getWorkshopAssetStatus: mockAssets }));
vi.mock("@/lib/workshop-settings", () => ({ getWorkshopSettings: mockSettings }));
vi.mock("@/lib/private-storage", () => ({ listPrivateObjects: mockList }));

import { getWorkshopFulfillmentReadiness, isWorkshopRecordingPubliclyReachable } from "@/lib/workshop-readiness";

describe("workshop evergreen fulfillment readiness", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAssets.mockResolvedValue({ slides: true, handout: true, skills: true });
    mockList.mockResolvedValue([
      "libro-movil.pdf",
      "libro-a4.pdf",
      "claude-nivel-experto-movil.pdf",
      "claude-nivel-experto-a4.pdf",
    ]);
    mockSettings.mockResolvedValue({
      sessionUrl: "",
      recordingUrl: "https://video.test/recording",
      skoolUrl: "https://www.skool.com/invite",
      skillsStoragePath: "",
      supportEmail: "sergio@crececonia.cl",
      roomEnabled: true,
      updatedAt: null,
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("habilita ventas sólo cuando todos los entregables están listos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, url: "https://video.test/recording" }));

    await expect(getWorkshopFulfillmentReadiness()).resolves.toMatchObject({ ready: true, missing: [], pending: [] });
  });

  it("bloquea una grabación privada que redirige al login de Google", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, url: "https://accounts.google.com/ServiceLogin" }));

    await expect(isWorkshopRecordingPubliclyReachable("https://drive.google.com/file/d/example/view")).resolves.toBe(false);
  });

  it("enumera cada recurso faltante y mantiene la venta cerrada", async () => {
    mockAssets.mockResolvedValue({ slides: false, handout: true, skills: false });
    mockSettings.mockResolvedValue({ recordingUrl: "", skoolUrl: "", roomEnabled: false });

    await expect(getWorkshopFulfillmentReadiness()).resolves.toMatchObject({
      ready: false,
      missing: ["room", "recording", "slides", "skills"],
      pending: ["skool"],
    });
  });

  it("mantiene la venta abierta cuando SKOOL está pendiente del lanzamiento", async () => {
    mockSettings.mockResolvedValue({ recordingUrl: "https://video.test/recording", skoolUrl: "", roomEnabled: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, url: "https://video.test/recording" }));

    await expect(getWorkshopFulfillmentReadiness()).resolves.toMatchObject({
      ready: true,
      missing: [],
      pending: ["skool"],
    });
  });

  it("bloquea la venta si falta cualquier formato de un ebook incluido", async () => {
    mockList.mockResolvedValue(["libro-movil.pdf", "libro-a4.pdf", "claude-nivel-experto-movil.pdf"]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, url: "https://video.test/recording" }));

    await expect(getWorkshopFulfillmentReadiness()).resolves.toMatchObject({
      ready: false,
      missing: ["ebooks"],
      missingEbookFiles: ["claude-nivel-experto-a4.pdf"],
    });
  });
});
