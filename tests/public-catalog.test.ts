import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import catalog from "@/content/public-catalog.json";
import { getHubItems } from "@/lib/hub";

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

  it("publica repositorios con fichas completas y enlaces HTTPS únicos", async () => {
    const urls = new Set<string>();
    const slugs = new Set<string>();
    expect(catalog.repositories.length).toBeGreaterThan(0);
    for (const repo of catalog.repositories) {
      expect(repo.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(repo.titulo.trim()).not.toBe("");
      expect(repo.descripcion.trim()).not.toBe("");
      expect(repo.tags.length).toBeGreaterThan(0);
      expect(new URL(repo.url).protocol).toBe("https:");
      expect(new URL(repo.url).hostname).toBe("github.com");
      expect(urls.has(repo.url)).toBe(false);
      expect(slugs.has(repo.slug)).toBe(false);
      urls.add(repo.url);
      slugs.add(repo.slug);
    }
    const hubRepos = (await getHubItems()).filter((item) => item.tipo === "repositorio");
    expect(hubRepos).toHaveLength(catalog.repositories.length);
    expect(hubRepos.every((item) => item.externo && urls.has(item.href))).toBe(true);
  });

  it("solo anuncia descargas que existen y no están vacías", () => {
    for (const skill of catalog.skills) {
      if (!skill.archivo_nombre) continue;
      const file = join(process.cwd(), "public", "downloads", "skills", skill.archivo_nombre);
      expect(existsSync(file), `${skill.slug}: falta ${skill.archivo_nombre}`).toBe(true);
      expect(statSync(file).size, `${skill.slug}: descarga vacía`).toBeGreaterThan(0);
      expect(statSync(file).size, `${skill.slug}: tamaño desactualizado`).toBe(skill.archivo_size);
      const entries = unzipSync(new Uint8Array(readFileSync(file)));
      expect(entries[`${skill.slug}/SKILL.md`], `${skill.slug}: falta SKILL.md en el ZIP`).toBeDefined();
      const sourceUrl = "repositorio_url" in skill ? skill.repositorio_url : undefined;
      const source = new URL(sourceUrl ?? "");
      expect(source.protocol).toBe("https:");
      expect(source.hostname).toBe("github.com");
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
