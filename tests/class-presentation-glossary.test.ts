import { describe, expect, it } from "vitest";
import { CLASS_PRESENTATION } from "@/lib/class-course-content";

const TECHNICAL_TERMS = [
  "IA", "V1", "URL", "iterar", "prompt", "agente", "brief", ".md", "CTA", "build",
  "dependencia", "integración", "Claude Code", "Codex", "repositorio", "Git", ".gitignore",
  "variable de entorno", "secreto", "token", ".env", "arquitectura", "landing", "e-commerce",
  "stack", "framework", "servidor", "Astro", "Next.js", "HTML", "CSS", "TypeScript", "Tailwind",
  "scaffold", "librería", "licencia", "responsive", "píxel", "accesibilidad", "alt", "test",
  "consola", "GitHub", "commit", "main", "rama", "remote", "origin", "push", "pull request",
  "merge", "diff", "check", "revert", "hosting", "deployment", "Preview", "Producción", "Vercel",
  "asset", "compresión", "componente", "módulo", "reduced motion", "bundle", "QA", "bug",
  "typecheck", "404", "performance", "JavaScript", "Lighthouse", "Core Web Vitals", "SEO", "GEO",
  "LLM", "metadatos", "canonical", "Open Graph", "sitemap", "JSON-LD", "crawler", "bot",
  "robots.txt", "noindex", "llms.txt", "autenticación", "API", "serverless", "validación",
  "honeypot", "rate limit", "frontend", "backend", "gateway", "webhook", "analítica", "SaaS",
  "persistencia", "roadmap",
] as const;

function slideText(slide: (typeof CLASS_PRESENTATION)[number]["slides"][number]) {
  return [slide.kicker, slide.title, ...slide.points, slide.action, slide.code ?? "", slide.speaker, slide.screen]
    .join(" ")
    .toLocaleLowerCase("es");
}

function termPattern(term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-záéíóúñ0-9])${escaped}([^a-záéíóúñ0-9]|$)`, "iu");
}

describe("presentación pedagógica", () => {
  it.each(TECHNICAL_TERMS)("explica %s en una slide de conceptos antes de reutilizarlo", (term) => {
    const slides = CLASS_PRESENTATION.flatMap((block) => block.slides);
    const firstOccurrence = slides.find((slide) => termPattern(term).test(slideText(slide)));

    expect(firstOccurrence, `No se encontró el término técnico: ${term}`).toBeDefined();
    expect(firstOccurrence?.kind, `El primer uso de ${term} debe ser conceptual`).toBe("concept");
  });

  it("mantiene títulos de navegación libres de jerga adelantada", () => {
    expect(CLASS_PRESENTATION.map((block) => block.title)).toEqual([
      "Apertura y resultado",
      "Cómo pedir y explicar",
      "Herramienta y carpeta",
      "Proyecto y referencias",
      "Primera versión",
      "Revisión de V1",
      "Guardar y publicar",
      "Mejorar por partes",
      "Pruebas y optimización",
      "Siguiente nivel y cierre",
    ]);
  });
});
