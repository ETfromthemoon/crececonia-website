// ── Capa de datos del Centro de Conocimiento ───────────────────────────────
// Trae skills + guías (y enlaces en Fase 2) desde la API pública y los
// normaliza a un shape común para mostrarlos juntos, agrupados por tema.

import { temasDeItem, type TemaId } from "./temas";

const API_BASE = "https://autodrive.cl";

export type HubTipo = "skill" | "guia" | "enlace";

export interface HubItem {
  tipo: HubTipo;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  tags: string[];
  href: string; // a dónde lleva el card (detalle interno o url externa)
  externo: boolean; // true → abre en nueva pestaña (enlaces)
  meta?: string; // info extra para el card (ej: "Descargable")
  temas: TemaId[];
}

async function getJSON(path: string): Promise<unknown> {
  try {
    const r = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function normSkill(s: Record<string, unknown>): HubItem {
  const slug = String(s.slug ?? "");
  const categoria = String(s.categoria ?? "");
  const tags = Array.isArray(s.tags) ? (s.tags as string[]) : [];
  return {
    tipo: "skill",
    slug,
    titulo: String(s.titulo ?? ""),
    descripcion: String(s.descripcion_corta ?? ""),
    categoria,
    tags,
    href: `/skills/${slug}`,
    externo: false,
    meta: s.archivo_nombre ? "Descargable" : undefined,
    temas: temasDeItem({ slug, categoria, tags }),
  };
}

function normGuia(g: Record<string, unknown>): HubItem {
  const slug = String(g.slug ?? "");
  const categoria = String(g.categoria ?? "");
  const tags = Array.isArray(g.tags) ? (g.tags as string[]) : [];
  return {
    tipo: "guia",
    slug,
    titulo: String(g.titulo ?? ""),
    descripcion: String(g.descripcion ?? ""),
    categoria,
    tags,
    href: `/guias/${slug}`,
    externo: false,
    temas: temasDeItem({ slug, categoria, tags }),
  };
}

function normEnlace(e: Record<string, unknown>): HubItem {
  const slug = String(e.slug ?? "");
  const categoria = String(e.categoria ?? "");
  const tags = Array.isArray(e.tags) ? (e.tags as string[]) : [];
  const url = String(e.url ?? "");
  return {
    tipo: "enlace",
    slug,
    titulo: String(e.titulo ?? ""),
    descripcion: String(e.descripcion ?? ""),
    categoria,
    tags,
    href: url, // link externo directo
    externo: true,
    meta: e.fuente ? String(e.fuente) : undefined,
    temas: temasDeItem({ slug, categoria, tags }),
  };
}

/** Trae todos los items publicados de las fuentes activas, en paralelo. */
export async function getHubItems(): Promise<HubItem[]> {
  const [skillsRaw, recursosRaw, enlacesRaw] = await Promise.all([
    getJSON("/api/public/skills"),
    getJSON("/api/public/recursos"),
    getJSON("/api/public/enlaces"),
  ]);

  const skills = Array.isArray(skillsRaw) ? skillsRaw : [];
  const recursos = Array.isArray(recursosRaw)
    ? recursosRaw
    : ((recursosRaw as { recursos?: unknown[] } | null)?.recursos ?? []);
  const enlacesArr = Array.isArray(enlacesRaw)
    ? enlacesRaw
    : ((enlacesRaw as { enlaces?: unknown[] } | null)?.enlaces ?? []);

  const items: HubItem[] = [
    ...skills.map((s) => normSkill(s as Record<string, unknown>)),
    ...recursos.map((g) => normGuia(g as Record<string, unknown>)),
    ...enlacesArr.map((e) => normEnlace(e as Record<string, unknown>)),
  ];
  return items;
}

export const TIPO_LABEL: Record<HubTipo, string> = {
  skill: "Skill",
  guia: "Guía",
  enlace: "Enlace",
};
