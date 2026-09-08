import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import WorkshopRoom from "@/components/WorkshopRoom";

const html = renderToStaticMarkup(
  <WorkshopRoom
    token="signed-room-token"
    flowToken="paid-flow-token"
    recordingUrl="https://example.com/grabacion"
    skoolUrl=""
    assetStatus={{ slides: true, handout: true, skills: true }}
    supportEmail="soporte@example.com"
  />
);

describe("WorkshopRoom", () => {
  it("muestra únicamente la acción de ver la grabación", () => {
    expect(html).toContain("Ver la grabación de la clase");
    expect(html).not.toContain("Entrar a la clase en vivo");
  });

  it("ofrece los dos formatos de cada ebook incluido", () => {
    expect(html.match(/format=movil/g)).toHaveLength(2);
    expect(html.match(/format=a4/g)).toHaveLength(2);
    expect(html.match(/Versión móvil/g)).toHaveLength(2);
    expect(html.match(/Versión A4/g)).toHaveLength(2);
  });
});
