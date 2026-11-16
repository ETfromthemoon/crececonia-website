"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DEMO_BOOKS } from "@/lib/marketplace/demo-catalog";

const names = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const money = (value: number) => `$${value.toLocaleString("es-CL")}`;
type CrececoniaBook = { title: string; coverSrc: string; href: string; category: keyof typeof names; description: string };

export default function DemoCatalog({ crececoniaBooks = [] }: { crececoniaBooks?: CrececoniaBook[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const books = useMemo(() => DEMO_BOOKS.filter((book) => {
    const text = `${book.title} ${book.subtitle} ${book.author} ${book.description}`.toLocaleLowerCase("es-CL");
    return (category === "todos" || book.category === category) && text.includes(query.trim().toLocaleLowerCase("es-CL"));
  }), [query, category]);
  const ownBooks = useMemo(() => crececoniaBooks.filter((book) => {
    const text = `${book.title} CrececonIA ${book.description}`.toLocaleLowerCase("es-CL");
    return (category === "todos" || book.category === category) && text.includes(query.trim().toLocaleLowerCase("es-CL"));
  }), [crececoniaBooks, query, category]);

  return <main className="md-shop">
    <section className="md-hero">
      <div className="md-wrap md-hero-grid">
        <div><div className="md-kicker">CRECECONIA / MARKETPLACE · DEMO INTERACTIVA</div>
          <h1>Ideas para leer.<br /><em>Herramientas para hacer.</em></h1>
          <p>Libros de CrececonIA y ejemplos de autores independientes sobre IA, tecnología y negocios. Explora el catálogo y recorre la experiencia de compra.</p>
          <a className="md-button" href="#explorar">Explorar ebooks <span aria-hidden>↗</span></a>
        </div>
        <div className="md-feature-cover" aria-label="Portada de muestra: IA para equipos">
          <div className="md-cover md-cover-violet"><span>CRECECONIA / AUTORES</span><strong>IA para<br />equipos.</strong><small>ANDREA MUÑOZ</small></div>
          <span className="md-feature-note">NUEVA LECTURA · 01 / 04</span>
        </div>
      </div>
    </section>
    <div className="md-signal"><div className="md-wrap"><span>Autores independientes</span><span>Lecturas aplicables</span><span>Curaduría editorial</span><span>Libros reales en sitio público</span></div></div>
    <section className="md-wrap md-catalog" id="explorar">
      <div className="md-section-head"><div><div className="md-kicker">01 / BIBLIOTECA</div><h2>Encuentra tu<br /><em>próximo paso.</em></h2></div><p>Filtra por tema y descubre qué aprenderás antes de elegir. Los ebooks de CrececonIA son reales; los autores invitados son ejemplos de esta demo.</p></div>
      <div className="md-toolbar">
        <label className="md-search"><span>Buscar en la biblioteca</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tema, autor o resultado…" /></label>
        <div className="md-categories" role="group" aria-label="Filtrar por categoría">{[["todos","Todos"],["ia","IA"],["tecnologia","Tecnología"],["negocios","Negocios"]].map(([key,label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}</div>
      </div>
      <div className="md-count" aria-live="polite">MOSTRANDO {books.length + ownBooks.length} DE {DEMO_BOOKS.length + crececoniaBooks.length} LIBROS</div>
      {books.length + ownBooks.length ? <div className="md-grid">
        {ownBooks.map((book) => <Link className="md-card" href={book.href} key={book.href}>
          <img className="mr-cover-image" src={book.coverSrc} alt={`Portada de ${book.title}`} loading="lazy" />
          <div className="md-card-info"><span className="md-card-meta">{names[book.category]} · CRECECONIA</span><h3>{book.title}</h3><p>Por CrececonIA</p><div className="md-card-bottom"><strong>Ver precio actual</strong><span>Ver en sitio público ↗</span></div></div>
        </Link>)}
        {books.map((book, index) => <Link className="md-card" href={`/ebooks/mercado/${book.slug}`} key={book.slug}>
        <div className={`md-cover md-cover-${book.cover}`}><span>CRECECONIA / AUTORES</span><strong>{book.title}</strong><small>{book.author.toUpperCase()}</small></div>
        <div className="md-card-info"><span className="md-card-meta">{names[book.category]} · {book.level}</span><h3>{book.title}</h3><p>{book.subtitle}</p><div className="md-card-bottom"><strong>{money(book.price)} CLP</strong><span aria-label={`Ver ${book.title}`}>Ver libro ↗</span></div></div>
        {index === 0 && <span className="md-card-tag">DESTACADO</span>}
      </Link>)}</div> : <p className="md-empty">No encontramos libros con esos filtros. Prueba otro tema.</p>}
    </section>
    <section className="md-author-cta"><div className="md-wrap"><div className="md-kicker">02 / PUBLICA CON NOSOTROS</div><h2>Tu conocimiento<br /><em>merece lectores.</em></h2><p>Presenta tu ebook, revisa tus ingresos estimados y sigue el estado de revisión desde tu espacio de autor.</p><Link className="md-button md-button-light" href="/ebooks/vender">Explorar espacio de autores <span aria-hidden>↗</span></Link></div></section>
    <div className="md-demo-note">Demo visual: los autores invitados son ficticios y aquí no se procesan pagos. Los ebooks de CrececonIA son reales; sus enlaces abren el sitio público.</div>
  </main>;
}
