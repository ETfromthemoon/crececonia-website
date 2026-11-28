import { ImageResponse } from "next/og";
import { EBOOK_CATALOG } from "@/lib/ebook-catalog";
import { absoluteUrl } from "@/lib/seo";
import { getPublicGuide, getPublicSkill } from "@/lib/public-catalog";
import { TEMAS_POR_ID } from "@/lib/temas";
import { getLaunch } from "@/lib/launches";
import { WORKSHOP_TITLE } from "@/lib/workshop-product";
import { CLASS_PATH, CLASS_TITLE } from "@/lib/class-product";

export const runtime = "nodejs";

const size = { width: 1200, height: 630 };
type Preview = { title: string; section: string; cover?: string };

const STATIC_PREVIEWS: Record<string, Preview> = {
  "/aprender": { title: "Aprende IA a tu ritmo", section: "Aprendizaje" },
  "/mentoria": { title: "Mentoría para aplicar IA", section: "Mentoría" },
  "/implementacion": { title: "Implementación de IA", section: "Implementación" },
  "/ia": { title: "IA aplicada a tu negocio", section: "Inteligencia artificial" },
  "/ebooks": { title: "Ebooks prácticos de IA", section: "Biblioteca digital" },
  "/centro": { title: "Centro de conocimiento", section: "Recursos prácticos" },
  "/centro/guias": { title: "Guías para aplicar IA", section: "Centro de conocimiento" },
  "/centro/skills": { title: "Skills para trabajar mejor", section: "Centro de conocimiento" },
  "/centro/enlaces": { title: "Enlaces útiles de IA", section: "Centro de conocimiento" },
  "/centro/repositorios": { title: "Repositorios para construir", section: "Centro de conocimiento" },
  "/publicador-drive": { title: "Publicador de videos desde Google Drive", section: "Automatización" },
  "/publicador-drive/privacidad": { title: "Privacidad del publicador de Drive", section: "Privacidad" },
  "/workshop-en-vivo-2026-09-06": { title: WORKSHOP_TITLE, section: "Workshop" },
  [CLASS_PATH]: { title: CLASS_TITLE, section: "Clase online", cover: "/clases/clase-construye-pagina-portada.png" },
};

async function previewForPath(path: string): Promise<Preview | null> {
  if (STATIC_PREVIEWS[path]) return STATIC_PREVIEWS[path];

  const ebook = EBOOK_CATALOG.find((entry) => entry.href === path);
  if (ebook) return { title: ebook.title, section: "Ebook práctico", cover: ebook.coverSrc };

  if (path.startsWith("/centro/")) {
    const tema = TEMAS_POR_ID[path.slice("/centro/".length) as keyof typeof TEMAS_POR_ID];
    if (tema) return { title: tema.titulo, section: "Centro de conocimiento" };
  }
  if (path.startsWith("/guias/")) {
    const guide = getPublicGuide(path.slice("/guias/".length));
    if (guide) return { title: guide.titulo, section: "Guía práctica" };
  }
  if (path.startsWith("/skills/")) {
    const skill = getPublicSkill(path.slice("/skills/".length));
    if (skill) return { title: skill.titulo, section: "Skill descargable" };
  }
  if (path.startsWith("/lanzamientos/")) {
    const launch = await getLaunch(path.slice("/lanzamientos/".length));
    if (launch?.status === "published") return { title: launch.headline, section: "Lanzamiento" };
  }
  return null;
}

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") || "";
  if (path.length > 140 || !/^\/[a-z0-9/-]+$/.test(path)) return new Response("Not found", { status: 404 });
  const preview = await previewForPath(path);
  if (!preview) return new Response("Not found", { status: 404 });
  const title = preview.title.slice(0, 110);
  const section = preview.section.slice(0, 42);
  const cover = preview.cover;
  let coverData: string | null = null;

  if (cover) {
    try {
      const response = await fetch(absoluteUrl(cover));
      if (response.ok) {
        const mime = cover.endsWith(".png") ? "image/png" : "image/jpeg";
        coverData = `data:${mime};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
      }
    } catch {
      // The title card remains usable if the cover CDN is temporarily unavailable.
    }
  }

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#171a18", color: "#f7f2e8", fontFamily: "Arial, sans-serif", padding: "52px 60px" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, justifyContent: "space-between", paddingRight: coverData ? 38 : 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.04em" }}>Crece<span style={{ color: "#c8da73" }}>con</span>IA</span>
          <span style={{ fontSize: 17, color: "#bfc7aa", textTransform: "uppercase", letterSpacing: "0.14em" }}>{section}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: coverData ? 670 : 1040 }}>
          <div style={{ width: 68, height: 7, borderRadius: 8, background: "#c8da73", marginBottom: 26 }} />
          <div style={{ fontSize: title.length > 65 ? 55 : title.length > 42 ? 64 : 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.055em", overflowWrap: "break-word" }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", borderTop: "1px solid #51594b", paddingTop: 20, color: "#bfc7aa", fontSize: 19 }}>
          <span>Ideas prácticas para avanzar con IA.</span>
          <span>crececonia.cl</span>
        </div>
      </div>
      {coverData && <div style={{ display: "flex", width: 330, height: 526, justifyContent: "center", alignItems: "center", borderRadius: 16, background: "#2d332c", padding: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverData} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 }} />
      </div>}
    </div>,
    { ...size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
