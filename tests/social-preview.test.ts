import { afterEach, describe, expect, it, vi } from "vitest";
import { createPageMetadata, socialImageUrl } from "@/lib/seo";
import { GET } from "@/app/api/social-image/route";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

vi.mock("@/lib/launches", () => ({ getLaunch: vi.fn() }));
vi.mock("@/lib/marketplace-review", () => ({ getPublishedMarketplaceBook: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());

describe("vistas previas contextuales", () => {
  it("genera una imagen distinta para cada contenido y conserva la portada de los ebooks", () => {
    const ebook = new URL(socialImageUrl("/ebook/claude-nivel-experto"));
    const guide = new URL(socialImageUrl("/guias/como-usar-ia"));

    expect(ebook.pathname).toBe("/api/social-image");
    expect(ebook.searchParams.get("path")).toBe("/ebook/claude-nivel-experto");
    expect(guide.searchParams.get("path")).toBe("/guias/como-usar-ia");
    expect(ebook.searchParams.get("title")).toBeNull();
    expect(ebook.toString()).not.toBe(guide.toString());
  });

  it("usa la misma imagen contextual para Open Graph y Twitter", () => {
    const metadata = createPageMetadata({
      title: "Mentoría de IA | CrececonIA",
      description: "Acompañamiento para aplicar IA.",
      path: "/mentoria",
    });
    const ogImage = metadata.openGraph?.images;
    const twitterImage = metadata.twitter?.images;
    expect(JSON.stringify(ogImage)).toContain("/api/social-image");
    expect(JSON.stringify(twitterImage)).toContain("/api/social-image");
    expect(JSON.stringify(ogImage)).toContain("%2Fmentoria");
  });

  it("renderiza una imagen PNG que los compartidores pueden descargar", async () => {
    const response = await GET(new Request("https://www.crececonia.cl/api/social-image?path=%2Fmentoria"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it("renderiza una portada real para el ebook sin aceptar texto arbitrario", async () => {
    const cover = await readFile(join(process.cwd(), "public/ebooks/claude-nivel-experto.jpg"));
    const fetch = vi.fn(async () => new Response(cover, { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    const response = await GET(new Request("https://www.crececonia.cl/api/social-image?path=%2Febook%2Fclaude-nivel-experto&title=Texto+falso"));
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("https://www.crececonia.cl/ebooks/claude-nivel-experto.jpg");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(10_000);

    const forged = await GET(new Request("https://www.crececonia.cl/api/social-image?path=%2Fno-existe&title=Texto+falso"));
    expect(forged.status).toBe(404);
  });
});
