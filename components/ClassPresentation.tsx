"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CLASS_PRESENTATION } from "@/lib/class-course-content";
import styles from "./ClassPresentation.module.css";

const slides = CLASS_PRESENTATION.flatMap((block) => block.slides.map((slide) => ({ ...slide, block })));

export default function ClassPresentation({ aulaHref }: { aulaHref: string }) {
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);
  const touchStart = useRef<number | null>(null);
  const wheelLocked = useRef(false);
  const slide = slides[index];
  const total = slides.length;
  const progress = ((index + 1) / total) * 100;
  const go = useCallback((next: number) => setIndex(Math.min(total - 1, Math.max(0, next))), [total]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") { event.preventDefault(); go(index + 1); }
      if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); go(index - 1); }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(total - 1);
      if (event.key.toLowerCase() === "n") setNotes((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, total]);
  const allBlocks = useMemo(() => CLASS_PRESENTATION.map((block) => ({ block, first: slides.findIndex((item) => item.block.id === block.id) })), []);

  function onWheel(event: React.WheelEvent<HTMLElement>) {
    if (Math.abs(event.deltaY) < 24 || wheelLocked.current) return;
    wheelLocked.current = true;
    go(index + (event.deltaY > 0 ? 1 : -1));
    window.setTimeout(() => { wheelLocked.current = false; }, 450);
  }
  function onTouchEnd(event: React.TouchEvent<HTMLElement>) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - event.changedTouches[0].clientX;
    if (Math.abs(delta) > 48) go(index + (delta > 0 ? 1 : -1));
    touchStart.current = null;
  }

  return <main className={`${styles.deck} class-deck`} onClick={() => go(index + 1)} onWheel={onWheel} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
    <div className="class-deck-progress"><i style={{ width: `${progress}%` }} /></div>
    <header className="class-deck-head" onClick={(event) => event.stopPropagation()}><a href={aulaHref}>← Volver al aula</a><span>{slide.block.time} · {slide.block.duration}</span><button onClick={() => setNotes((current) => !current)} type="button">{notes ? "Ocultar" : "Mostrar"} notas <kbd>N</kbd></button></header>
    <section key={index} className={`class-deck-slide is-${slide.kind ?? "default"}`} aria-live="polite" aria-label={`Slide ${index + 1} de ${total}`}>
      <div className="class-deck-meta"><span>{slide.kicker}</span><b>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</b></div>
      <h1>{slide.title}</h1>
      {slide.code && <pre className="class-deck-code"><code>{slide.code}</code></pre>}
      {!!slide.points.length && <ul>{slide.points.map((point) => <li key={point}>{point}</li>)}</ul>}
      <div className="class-deck-action"><span>Ahora</span><strong>{slide.action}</strong></div>
    </section>
    {notes && <aside className="class-deck-notes" onClick={(event) => event.stopPropagation()}><div><span>Qué decir</span><p>{slide.speaker}</p></div><div><span>Qué mostrar</span><p>{slide.screen}</p></div></aside>}
    <footer className="class-deck-footer" onClick={(event) => event.stopPropagation()}><div className="class-deck-blocks">{allBlocks.map(({ block, first }) => <button aria-label={`Ir al bloque ${block.title}`} className={slide.block.id === block.id ? "is-active" : ""} type="button" onClick={() => go(first)} key={block.id}>{block.time}<span>{block.title}</span></button>)}</div><div className="class-deck-controls"><button aria-label="Slide anterior" type="button" onClick={() => go(index - 1)} disabled={!index}>←</button><button aria-label="Slide siguiente" type="button" onClick={() => go(index + 1)} disabled={index === total - 1}>→</button></div></footer>
  </main>;
}
