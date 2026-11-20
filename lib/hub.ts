// ── Capa de datos del Centro de Conocimiento ───────────────────────────────
// Normaliza el catálogo versionado de skills, guías, enlaces y repositorios
// para mostrarlos juntos, agrupados por tema.

import { temasDeItem, type TemaId } from "./temas";
import { listPublicGuides, listPublicLinks, listPublicRepositories, listPublicSkills } from "./public-catalog";

export type HubTipo = "skill" | "guia" | "enlace" | "repositorio";

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

function normRepositorio(repo: Record<string, unknown>): HubItem {
  const slug = String(repo.slug ?? "");
  const categoria = String(repo.categoria ?? "");
  const tags = Array.isArray(repo.tags) ? (repo.tags as string[]) : [];
  return {
    tipo: "repositorio",
    slug,
    titulo: String(repo.titulo ?? ""),
    descripcion: String(repo.descripcion ?? ""),
    categoria,
    tags,
    href: String(repo.url ?? ""),
    externo: true,
    meta: "GitHub",
    temas: temasDeItem({ slug, categoria, tags }),
  };
}

/** Reúne los recursos publicados del catálogo local. */
export async function getHubItems(): Promise<HubItem[]> {
  const skills = listPublicSkills();
  const recursos = listPublicGuides();
  const enlacesArr = listPublicLinks();
  const repositorios = listPublicRepositories();

  const items: HubItem[] = [
    ...skills.map((s) => normSkill(s as Record<string, unknown>)),
    ...recursos.map((g) => normGuia(g as Record<string, unknown>)),
    ...enlacesArr.map((e) => normEnlace(e as Record<string, unknown>)),
    ...repositorios.map((repo) => normRepositorio(repo as Record<string, unknown>)),
  ];
  return items;
}

export const TIPO_LABEL: Record<HubTipo, string> = {
  skill: "Skill",
  guia: "Guía",
  enlace: "Enlace",
  repositorio: "Repositorio",
};
