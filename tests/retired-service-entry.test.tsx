import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/Navbar", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
import BpiPage, { metadata } from "@/app/protocolo-bpi/page";
import CallPage from "@/app/solicitar-llamada/page";

describe("retired service entry points", () => {
  it.each([BpiPage, CallPage])("offers current services without an intake or booking form", (Page) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain('href="/ia"');
    expect(html).toContain("Retiramos el Protocolo BPI y el Test de Fit");
    expect(html).not.toContain("<form");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("30 minutos");
    expect(html).not.toContain("horas hábiles");
  });
  it("does not imply an old scheduling link books or cancels a conversation", () => {
    const html = renderToStaticMarkup(<CallPage />);
    expect(html).toContain("no reserva una reunión");
    expect(html).toContain("Si ya coordinaste una conversación");
  });
  it("does not advertise the retired offer to search engines", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
