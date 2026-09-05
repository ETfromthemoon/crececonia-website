import { describe, expect, it } from "vitest";
import { buildLaunchTasks, canPublishLaunch, parseCreateLaunchInput, slugifyLaunch } from "@/lib/launch-model";

describe("centro de lanzamientos", () => {
  it("normaliza nombres a identificadores web estables", () => {
    expect(slugifyLaunch("Taller: Agentes + Ventas 2027")).toBe("taller-agentes-ventas-2027");
  });

  it("crea un checklist completo conectado con Zernio", () => {
    const tasks = buildLaunchTasks({ name: "Taller agentes", slug: "taller-agentes", dmKeyword: "AGENTES", adCampaignName: null });
    expect(tasks.map((task) => task.category)).toEqual(["zernio", "publications", "dm", "ads", "automation", "delivery", "analytics"]);
    expect(tasks.every((task) => task.required && task.owner === "Zernio")).toBe(true);
    expect(tasks.find((task) => task.category === "dm")?.instructions).toContain("AGENTES");
  });

  it("impide publicar mientras exista una tarea obligatoria no aprobada", () => {
    const result = canPublishLaunch({ cta_url: "https://crececonia.cl", products: [], tasks: [{ required: true, status: "not_applicable" }] });
    expect(result.ok).toBe(false);
    expect(result.reasons[0]).toContain("1 tareas");
  });

  it("impide publicar si Zernio no está sincronizado", () => {
    const result = canPublishLaunch({ cta_url: "https://crececonia.cl", products: [], zernio_status: "error", tasks: [] });
    expect(result.ok).toBe(false);
    expect(result.reasons[0]).toContain("Zernio");
  });

  it("valida fechas, URLs y parámetros del formulario", () => {
    const parsed = parseCreateLaunchInput({ name: "Lanzamiento ebook", launchType: "ebook_release", ctaUrl: "https://crececonia.cl/ebooks", startPriceMinor: 15000, productResources: ["ebook:uno", "ebook:uno"] });
    expect(parsed.slug).toBe("lanzamiento-ebook");
    expect(parsed.productResources).toEqual(["ebook:uno"]);
    expect(() => parseCreateLaunchInput({ name: "Evento", ctaUrl: "javascript:alert(1)" })).toThrow(/http o https/);
  });
});
