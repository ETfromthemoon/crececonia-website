"use client";

import { useEffect, useState } from "react";

export default function GuideOutline() {
  const [headings, setHeadings] = useState<{ id: string; title: string; level: number }[]>([]);
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".guide-content h2, .guide-content h3"));
    const generated: HTMLElement[] = [];
    setHeadings(elements.map((element, index) => {
      if (!element.id) {
        element.id = `guide-section-${index + 1}`;
        generated.push(element);
      }
      return { id: element.id, title: element.textContent ?? "", level: Number(element.tagName.slice(1)) };
    }));
    return () => generated.forEach(element => element.removeAttribute("id"));
  }, []);
  if (!headings.length) return null;
  return <details className="guide-outline">
    <summary>En esta guía <span>{headings.length} secciones</span></summary>
    <nav aria-label="Índice de la guía"><ol>{headings.map(heading => <li key={heading.id} data-level={heading.level}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ol></nav>
  </details>;
}
