import { describe, expect, it } from "vitest";
import { getEbookBundleOffers, getOfferIdForResources } from "@/lib/ebook-offers";

const AFTER_LAUNCH = new Date("2026-08-07T21:00:00-04:00").getTime();

describe("motor de ofertas de ebooks", () => {
  it("convierte Claude Experto + Agentes en una ruta comercial clara", () => {
    expect(getEbookBundleOffers("ebook:claude-nivel-experto", AFTER_LAUNCH)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "ruta-automatizacion",
          extras: ["ebook:agentes-de-ia"],
        }),
      ])
    );
  });

  it("no ofrece rutas que todavía no están a la venta", () => {
    const beforeLaunch = new Date("2026-08-07T10:00:00-04:00").getTime();
    expect(getEbookBundleOffers("ebook:claude-nivel-experto", beforeLaunch)).toEqual([]);
  });

  it("reconoce la oferta por el conjunto exacto de ebooks, sin confiar en el cliente", () => {
    expect(
      getOfferIdForResources(["ebook:agentes-de-ia", "ebook:claude-nivel-experto"])
    ).toBe("ruta-automatizacion");
    expect(getOfferIdForResources(["ebook:agentes-de-ia"])).toBeUndefined();
  });
});
