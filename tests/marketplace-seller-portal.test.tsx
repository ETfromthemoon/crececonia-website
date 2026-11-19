import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import SellerPortal from "@/app/ebooks/vender/SellerPortal";

it("keeps the test seller and the example sale out of production", () => {
  const html = renderToStaticMarkup(<SellerPortal demoAvailable={false} showPanelPreview />);
  expect(html).toContain("Espacio de autores");
  expect(html).not.toContain("Andrea Muñoz");
  expect(html).not.toContain("$10.955");
});

it("shows the real layout with read-only amounts in preview", () => {
  const html = renderToStaticMarkup(<SellerPortal demoAvailable showPanelPreview />);
  expect(html).toContain("Mis ebooks");
  expect(html).toContain("Ventas confirmadas");
  expect(html).toContain("Liquidaciones");
  expect(html).toContain("$10.479 CLP");
  expect(html).toContain("IVA de la comisión</dt><dd>$171 CLP");
  expect(html).not.toContain("Guardar borrador");
  expect(html).not.toContain("Cerrar sesión");
});
