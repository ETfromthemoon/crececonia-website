import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import catalog from "@/content/public-catalog.json";

describe("catálogo público sin VPS", () => {
  it("publica solo las 9 guías completas y los 5 skills sin duplicados", () => {
    expect(catalog.guides).toHaveLength(9);
    expect(new Set(catalog.guides.map((item) => item.slug)).size).toBe(9);
    expect(catalog.skills).toHaveLength(5);
    expect(new Set(catalog.skills.map((item) => item.slug)).size).toBe(5);
  });

  it("no contiene enlaces al VPS retirado", () => {
    expect(JSON.stringify(catalog)).not.toContain("autodrive.cl");
  });

  it("solo anuncia descargas que existen y no están vacías", () => {
    for (const skill of catalog.skills) {
      if (!skill.archivo_nombre) continue;
      const file = join(process.cwd(), "public", "downloads", "skills", skill.archivo_nombre);
      expect(existsSync(file), `${skill.slug}: falta ${skill.archivo_nombre}`).toBe(true);
      expect(statSync(file).size, `${skill.slug}: descarga vacía`).toBeGreaterThan(0);
    }
  });

  it("mantiene títulos, descripciones y contenido utilizable", () => {
    for (const guide of catalog.guides) {
      expect(guide.titulo.trim()).not.toBe("");
      expect(guide.descripcion.trim()).not.toBe("");
      expect(guide.contenido_md.trim()).not.toBe("");
    }
  });

  it("no publica guías incompletas ni fragmentos históricos", () => {
    expect(catalog.guides.some((guide) => guide.slug.startsWith("convierte-un-selfie-"))).toBe(false);
    for (const guide of catalog.guides) {
      expect(guide.contenido_completo).toBe(true);
      expect(guide.contenido_md.length).toBeGreaterThan(300);
    }
  });

  it("no enlaza desde las guías a otras guías no publicadas", () => {
    const published = new Set(catalog.guides.map((guide) => guide.slug));
    for (const guide of catalog.guides) {
      for (const match of guide.contenido_md.matchAll(/\]\(\/guias\/([^)?#]+)(?:[?#][^)]*)?\)/g)) {
        expect(published.has(match[1]), `${guide.slug}: enlace roto a ${match[1]}`).toBe(true);
      }
    }
  });
});
