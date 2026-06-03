// ── Temas / objetivos del Centro de Conocimiento ───────────────────────────
// Eje principal de navegación: el usuario busca por OBJETIVO, no por tipo.
// Cada item (skill/guía/enlace) se asigna a uno o más temas vía:
//   1. slugs curados (asignación manual precisa)
//   2. matchers por categoria/tags (clasifica items futuros automáticamente)

export type TemaId =
  | "clientes"
  | "vender"
  | "automatizar"
  | "ia"
  | "contenido"
  | "gestion";

export interface Tema {
  id: TemaId;
  titulo: string;
  descripcion: string;
  match: {
    categorias?: string[]; // categorías (skill o guía) que caen en este tema
    tags?: string[]; // tags que caen en este tema
    slugs?: string[]; // asignación manual (gana siempre)
  };
}

export const TEMAS: Tema[] = [
  {
    id: "clientes",
    titulo: "Conseguir más clientes",
    descripcion:
      "Prospección, captación y outreach. Encontrar y atraer a los clientes correctos.",
    match: {
      tags: ["prospección", "leads", "outreach", "linkedin", "captación", "pymes"],
      slugs: ["captaclientes", "prompts-para-tu-negocio-por-industria"],
    },
  },
  {
    id: "vender",
    titulo: "Vender mejor",
    descripcion:
      "Copywriting, propuestas y conversión. Convertir interés en ventas reales.",
    match: {
      tags: ["copywriting", "ventas", "cro", "email", "seo", "marketing"],
      slugs: ["marketing-skills-claude-code"],
    },
  },
  {
    id: "automatizar",
    titulo: "Automatizar tu negocio",
    descripcion:
      "Workflows e IA aplicada a tu operación. Hacer más con menos esfuerzo manual.",
    match: {
      categorias: ["productividad"],
      tags: ["automation", "automatización", "agentes", "mcp", "workflow"],
      slugs: ["landing-builder"],
    },
  },
  {
    id: "ia",
    titulo: "Usar IA y Claude Code",
    descripcion:
      "Prompts, skills técnicas y herramientas. Sacarle el jugo a la IA en tu día a día.",
    match: {
      categorias: ["Claude Code", "Prompts", "Skills", "Herramientas", "desarrollo"],
      tags: ["claude", "claude code", "claude-code", "ia", "cli", "prompts", "magic ui", "frontend"],
      slugs: [
        "guia-completa-para-usar-claude-code",
        "como-escribir-prompts-que-funcionan",
        "3-herramientas-para-que-tu-web-hecha-con-ia-no-parezca-hecha-con-ia-magic-ui-imp",
      ],
    },
  },
  {
    id: "contenido",
    titulo: "Crear contenido",
    descripcion:
      "Guiones, social, foto y marca. Producir contenido que conecta y se ve profesional.",
    match: {
      tags: ["video", "reels", "tiktok", "shorts", "guiones", "viral", "contenido", "imagenes", "foto de perfil", "diseño web"],
      slugs: [
        "generador-de-guiones-virales",
        "convierte-un-selfie-en-un-informe-de-estetica-facial-con-chatgpt-y-mejora-tu-fot",
      ],
    },
  },
  {
    id: "gestion",
    titulo: "Gestión y procesos",
    descripcion:
      "Organización, métricas y herramientas para ordenar y medir tu negocio.",
    match: {
      categorias: ["negocio"],
      tags: ["procesos", "métricas", "gestión", "organización"],
    },
  },
];

export const TEMAS_POR_ID: Record<TemaId, Tema> = Object.fromEntries(
  TEMAS.map((t) => [t.id, t]),
) as Record<TemaId, Tema>;

/** Devuelve los IDs de tema que matchean un item por slug/categoria/tags. */
export function temasDeItem(item: {
  slug: string;
  categoria?: string;
  tags?: string[];
}): TemaId[] {
  const cat = (item.categoria ?? "").toLowerCase();
  const tags = (item.tags ?? []).map((t) => t.toLowerCase());
  const ids: TemaId[] = [];
  for (const tema of TEMAS) {
    const m = tema.match;
    const bySlug = m.slugs?.includes(item.slug) ?? false;
    const byCat = m.categorias?.some((c) => c.toLowerCase() === cat) ?? false;
    const byTag = m.tags?.some((t) => tags.includes(t.toLowerCase())) ?? false;
    if (bySlug || byCat || byTag) ids.push(tema.id);
  }
  return ids;
}
