"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const PROCESS_STEPS = [
  ["01", "Referencia", "Web, redes o screenshots"],
  ["02", "Contexto", "Carpeta, mapa y agente"],
  ["03", "Construcción", "Código y componentes reales"],
  ["04", "Publicación", "GitHub y Vercel"],
  ["05", "Iteración", "Una web completa"],
] as const;

export function ClassProcessVisual() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.28 });

  return (
    <figure
      ref={ref}
      className="class-process-visual"
      data-visible={reduceMotion || isInView}
    >
      <div className="class-process-chrome" aria-hidden="true">
        <span /><span /><span />
        <code>workflow/build-a-website</code>
      </div>
      <div className="class-process-flow">
        <div className="class-process-line" aria-hidden="true"><i /></div>
        <ol>
          {PROCESS_STEPS.map(([number, title, detail], index) => (
            <li key={number} style={{ "--process-delay": `${index * 110}ms` } as CSSProperties}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              <i aria-hidden="true">{index === PROCESS_STEPS.length - 1 ? "✓" : "→"}</i>
            </li>
          ))}
        </ol>
      </div>
      <figcaption><span>PROCESO REAL / NO SOLO TEORÍA</span><span>REFERENCIA → WEB PUBLICADA</span></figcaption>
    </figure>
  );
}

export function ClassBookFan({ covers }: { covers: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <div
      ref={ref}
      className="class-book-covers"
      data-open={reduceMotion || isInView}
      aria-hidden="true"
    >
      {covers.map((cover, index) => (
        <img
          key={cover}
          src={cover}
          alt=""
          style={{
            "--book-index": index,
            "--book-delay": `${index * 80}ms`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
