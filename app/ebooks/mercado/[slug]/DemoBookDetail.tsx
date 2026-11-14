"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DEMO_BOOKS, type DemoBook } from "@/lib/marketplace/demo-catalog";

const names = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const money = (value: number) => `$${value.toLocaleString("es-CL")}`;

export default function DemoBookDetail({ book }: { book: DemoBook }) {
  const [checkout, setCheckout] = useState(false);
  const [complete, setComplete] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!checkout) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCheckout(false);
      if (event.key === "Tab") {
        const buttons = modalRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); triggerRef.current?.focus(); };
  }, [checkout]);
  const related = DEMO_BOOKS.filter(item => item.slug !== book.slug).slice(0, 2);
  return <main className="md-shop">
    <div className="md-wrap md-detail">
      <Link className="md-back" href="/ebooks/mercado">← Volver al marketplace</Link>
      <div className="md-detail-hero">
        <div className={`md-cover md-cover-${book.cover}`}><span>CRECECONIA / AUTORES</span><strong>{book.title}</strong><small>{book.author.toUpperCase()}</small></div>
        <div className="md-detail-main"><div className="md-kicker">{names[book.category]} / {book.level} · DEMO</div><h1>{book.title}</h1><p className="md-detail-subtitle">{book.subtitle}</p><p className="md-detail-author">Por <strong>{book.author}</strong> · {book.pages} páginas · PDF digital</p><p className="md-detail-description">{book.description}</p><div className="md-detail-purchase"><div><span>PRECIO DEL EBOOK</span><strong>{money(book.price)} CLP</strong></div><button ref={triggerRef} className="md-button" type="button" onClick={() => { setCheckout(true); setComplete(false); }}>Simular compra <span aria-hidden>↗</span></button></div><p className="md-detail-disclaimer">Vista de demostración. El flujo no cobra ni entrega un archivo.</p></div>
      </div>
      <div className="md-detail-content"><section><div className="md-kicker">01 / LO QUE TE LLEVAS</div><h2>De la lectura<br /><em>a la práctica.</em></h2><div className="md-outcomes">{book.outcomes.map((item, i) => <div key={item}><span>0{i+1}</span><p>{item}</p><span aria-hidden>↗</span></div>)}</div></section><section><div className="md-kicker">02 / ÍNDICE</div><h2>Por dentro<br /><em>del ebook.</em></h2><ol className="md-chapters">{book.chapters.map((item, i) => <li key={item}><span>{String(i+1).padStart(2,"0")}</span>{item}</li>)}</ol></section></div>
      <section className="md-related"><div className="md-kicker">03 / SIGUE EXPLORANDO</div><h2>Lecturas que se conectan.</h2><div className="md-related-grid">{related.map(item => <Link href={`/ebooks/mercado/${item.slug}`} key={item.slug}><div className={`md-cover md-cover-${item.cover}`}><span>CRECECONIA / AUTORES</span><strong>{item.title}</strong><small>{item.author.toUpperCase()}</small></div><div><span>{names[item.category]}</span><h3>{item.title}</h3><p>{money(item.price)} CLP <b>Ver libro ↗</b></p></div></Link>)}</div></section>
    </div>
    {checkout && <div className="md-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCheckout(false); }}><div ref={modalRef} className="md-modal" role="dialog" aria-modal="true" aria-labelledby="md-modal-title"><button ref={closeRef} className="md-modal-close" type="button" onClick={() => setCheckout(false)} aria-label="Cerrar">×</button>{complete ? <><div className="md-kicker">RECORRIDO FINALIZADO</div><h2 id="md-modal-title">Así se vería tu confirmación.</h2><p>En una compra real, la persona recibiría un enlace de descarga por correo después del pago. Esta demostración no hizo ningún cobro, envío ni registro.</p><button className="md-button" type="button" onClick={() => setCheckout(false)}>Seguir explorando ↗</button></> : <><div className="md-kicker">COMPRA DE DEMOSTRACIÓN</div><h2 id="md-modal-title">Tu próximo libro está listo.</h2><p>Explora cómo se vería el resumen antes de ir a una pasarela de pago.</p><div className="md-order-line"><span>{book.title}</span><strong>{money(book.price)} CLP</strong></div><button className="md-button" type="button" onClick={() => setComplete(true)}>Ver confirmación de muestra ↗</button><p><small>Sin correo, registro ni pago real.</small></p></>}</div></div>}
    <div className="md-demo-note">Demo visual de producto. Libros y autores ficticios. No se procesan pagos.</div>
  </main>;
}
