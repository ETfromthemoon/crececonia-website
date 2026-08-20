"use client";

import { useEffect, useMemo, useState } from "react";
import { CLASS_PRESENTATION } from "@/lib/class-course-content";

const slides = CLASS_PRESENTATION.flatMap((block) => block.slides.map((slide) => ({ ...slide, block })));

export default function ClassPresentation({ aulaHref }: { aulaHref: string }) {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const slide = slides[index];
  const total = slides.length;
  const progress = ((index + 1) / total) * 100;
  const go = (next: number) => setIndex(Math.min(total - 1, Math.max(0, next)));
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " ") { event.preventDefault(); go(index + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(index - 1); }
      if (event.key.toLowerCase() === "n") setNotes((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);
  const allBlocks = useMemo(() => CLASS_PRESENTATION.map((block) => ({ block, first: slides.findIndex((item) => item.block.id === block.id) })), []);

  return <main className="class-deck" onClick={() => go(index + 1)}>
    <div className="class-deck-progress"><i style={{ width: `${progress}%` }} /></div>
    <header className="class-deck-head" onClick={(event) => event.stopPropagation()}><a href={aulaHref}>← Volver al aula</a><span>{slide.block.time} · {slide.block.duration}</span><button onClick={() => setNotes((current) => !current)} type="button">{notes ? "Ocultar" : "Mostrar"} notas <kbd>N</kbd></button></header>
    <section className="class-deck-slide" aria-live="polite"><div className="class-deck-meta"><span>{slide.kicker}</span><b>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</b></div><h1>{slide.title}</h1><ul>{slide.points.map((point) => <li key={point}>{point}</li>)}</ul><div className="class-deck-action"><span>Ahora</span><strong>{slide.action}</strong></div></section>
    {notes && <aside className="class-deck-notes" onClick={(event) => event.stopPropagation()}><div><span>Qué decir</span><p>{slide.speaker}</p></div><div><span>Qué mostrar</span><p>{slide.screen}</p></div></aside>}
    <footer className="class-deck-footer" onClick={(event) => event.stopPropagation()}><div className="class-deck-blocks">{allBlocks.map(({ block, first }) => <button className={slide.block.id === block.id ? "is-active" : ""} type="button" onClick={() => go(first)} key={block.id}>{block.time}<span>{block.title}</span></button>)}</div><div className="class-deck-controls"><button type="button" onClick={() => go(index - 1)} disabled={!index}>←</button><button type="button" onClick={() => go(index + 1)} disabled={index === total - 1}>→</button></div></footer>
  </main>;
}
