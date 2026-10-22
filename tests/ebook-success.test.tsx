import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { books } = vi.hoisted(() => ({ books: vi.fn() }));
vi.mock("@/lib/ebook-purchased-resources", () => ({ getPurchasedBooksByToken: books }));
import SuccessPage from "@/app/ebook/de-cero-a-claude-en-una-semana/success/page";

describe("retorno de Flow", () => {
  beforeEach(() => { vi.clearAllMocks(); books.mockResolvedValue([]); });

  it.each([undefined, "token-sin-confirmar"])("no anuncia una compra exitosa sin libros autorizados: %s", async (token) => {
    const html = renderToStaticMarkup(await SuccessPage({ searchParams: Promise.resolve({ token }) }));
    expect(html).not.toContain("Compra exitosa");
    expect(html).not.toContain("¡Gracias por tu compra!");
    expect(html).not.toContain("Tu compra está confirmada");
    expect(html).not.toContain("/api/ebook/download?");
    expect(html).toContain('href="/ebook/descargar"');
    if (!token) expect(books).not.toHaveBeenCalled();
  });

  it("muestra las descargas de una compra autorizada con su recurso y token", async () => {
    books.mockResolvedValue([{ resource: "ebook:agentes-de-ia", title: "Agentes de IA para tu Negocio" }]);
    const html = renderToStaticMarkup(await SuccessPage({ searchParams: Promise.resolve({ token: "tok&1" }) }));
    expect(html).toContain("¡Gracias por tu compra!");
    expect(html).toContain("token=tok%261&amp;resource=ebook%3Aagentes-de-ia");
    expect(html).toContain("format=a4");
  });
});
