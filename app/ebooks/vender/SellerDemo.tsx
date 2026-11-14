"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";
import "./demo.css";

type View = "inicio" | "libros" | "ventas" | "calculadora" | "configuracion";
type DemoBook = { id: number; title: string; subtitle: string; category: string; price: number; status: "Publicado" | "En revisión" | "Borrador"; tone: string; sales: number };

const initialBooks: DemoBook[] = [
  { id: 1, title: "IA para equipos", subtitle: "De la curiosidad a la implementación", category: "Inteligencia artificial", price: 11900, status: "Publicado", tone: "sage", sales: 86 },
  { id: 2, title: "Negocios con datos", subtitle: "Decisiones más claras, equipos más ágiles", category: "Negocios", price: 9900, status: "En revisión", tone: "indigo", sales: 0 },
  { id: 3, title: "Automatiza tu semana", subtitle: "Sistemas simples que liberan tiempo", category: "Tecnología", price: 8900, status: "Borrador", tone: "clay", sales: 0 },
];
const money = (value: number) => `$${value.toLocaleString("es-CL")}`;
const tabs: { id: View; label: string; icon: string }[] = [
  { id: "inicio", label: "Resumen", icon: "▦" }, { id: "libros", label: "Mis ebooks", icon: "▤" },
  { id: "ventas", label: "Ventas", icon: "▥" }, { id: "calculadora", label: "Simulador", icon: "◈" },
  { id: "configuracion", label: "Mi perfil", icon: "◎" },
];
const chart = [35, 46, 41, 65, 56, 73, 63, 83, 76, 91, 80, 100];

function Cover({ book, large = false }: { book: DemoBook; large?: boolean }) {
  return <div className={`seller-demo-cover ${book.tone} ${large ? "large" : ""}`} aria-hidden="true">
    <span className="seller-demo-cover-mark">CRECE<br />CON IA</span><strong>{book.title}</strong><small>{book.subtitle}</small><i />
  </div>;
}

export default function SellerDemo({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<View>("inicio");
  const [books, setBooks] = useState(initialBooks);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [price, setPrice] = useState("11900");
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const focusBeforeDialog = useRef<HTMLElement | null>(null);
  const activeBook = typeof editing === "number" ? books.find((book) => book.id === editing) : undefined;

  useEffect(() => {
    if (editing === null) {
      if (focusBeforeDialog.current?.isConnected) focusBeforeDialog.current.focus();
      else if (focusBeforeDialog.current) document.querySelector<HTMLButtonElement>(".seller-demo-pagehead button")?.focus();
      focusBeforeDialog.current = null;
      return;
    }

    focusBeforeDialog.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditing(null);
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]")];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls[controls.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) { event.preventDefault(); controls[0].focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  function saveBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const subtitle = String(form.get("subtitle") ?? "").trim();
    const category = String(form.get("category") ?? "Tecnología");
    const amount = Number(form.get("price"));
    if (title.length < 3 || !Number.isSafeInteger(amount) || amount < 500) return;
    if (typeof editing === "number") {
      setBooks((current) => current.map((book) => book.id === editing ? { ...book, title, subtitle, category, price: amount, status: "Borrador" } : book));
      setNotice("Cambios guardados en esta demo. El libro vuelve a borrador para revisión.");
    } else {
      setBooks((current) => [...current, { id: Date.now(), title, subtitle, category, price: amount, status: "Borrador", tone: "sage", sales: 0 }]);
      setNotice("Borrador creado en esta demo. No se guardó en el servidor.");
    }
    setEditing(null);
    setView("libros");
  }

  function submitReview(id: number) {
    setBooks((current) => current.map((book) => book.id === id ? { ...book, status: "En revisión" } : book));
    setNotice("Solicitud de revisión simulada. En el servicio real se requieren portada, PDF y aprobación editorial.");
  }

  return <main className="seller-demo">
    <aside className="seller-demo-sidebar" aria-label="Navegación del panel de autores">
      <Link href="/ebooks" className="seller-demo-brand"><span className="seller-demo-brand-icon">C<span>◦</span></span><span>CRECE CON IA<small>MARKETPLACE</small></span></Link>
      <div className="seller-demo-workspace"><span className="seller-demo-avatar">AM</span><span><strong>Andrea Muñoz</strong><small>Autora verificada · Demo</small></span><span aria-hidden="true">⌄</span></div>
      <p className="seller-demo-navlabel">ESPACIO DE AUTOR</p>
      <nav>{tabs.map((tab) => <button key={tab.id} type="button" className={view === tab.id ? "active" : ""} onClick={() => { setView(tab.id); setEditing(null); }}><span aria-hidden="true">{tab.icon}</span>{tab.label}{tab.id === "libros" && <small>{books.length}</small>}</button>)}</nav>
      <div className="seller-demo-sidebar-bottom"><div className="seller-demo-help"><span>✦</span><strong>Tu próxima publicación empieza aquí.</strong><p>Explora el flujo completo con datos de muestra.</p><button type="button" onClick={() => { setView("libros"); setEditing("new"); }}>Crear ebook <span>↗</span></button></div><Link href="/ebooks/mercado">Ver tienda <span>↗</span></Link><Link href="/admin/marketplace">Vista administración <span>↗</span></Link><button type="button" onClick={onExit}>Salir de la demo <span>↗</span></button></div>
    </aside>

    <div className="seller-demo-main">
      <div className="seller-demo-topbar"><span>MARKETPLACE / <strong>{tabs.find((tab) => tab.id === view)?.label.toUpperCase()}</strong></span><div><Link href="/ebooks/mercado" className="seller-demo-toplink">Tienda ↗</Link><Link href="/admin/marketplace" className="seller-demo-toplink">Administración ↗</Link><span className="seller-demo-live"><i /> VISTA DE DEMOSTRACIÓN</span><span className="seller-demo-topavatar">AM</span></div></div>
      {notice && <div className="seller-demo-notice" role="status"><span>✓</span>{notice}<button type="button" aria-label="Cerrar aviso" onClick={() => setNotice("")}>×</button></div>}
      <div className="seller-demo-content">
        {view === "inicio" && <>
          <div className="seller-demo-pagehead"><div><p className="seller-demo-kicker">VIERNES · TU ESPACIO DE AUTOR</p><h1>Hola, Andrea <span>✳</span></h1><p>Así se vería tu negocio de ebooks en Crece con IA.</p></div><button type="button" className="seller-demo-primary" onClick={() => { setView("libros"); setEditing("new"); }}>+ Crear nuevo ebook</button></div>
          <div className="seller-demo-banner"><div><span>RECORRIDO INTERACTIVO</span><h2>Tu conocimiento, una nueva fuente de ingresos.</h2><p>Publica, mide tus ventas y descubre oportunidades para llegar a más lectores.</p><button type="button" onClick={() => setView("configuracion")}>Conocer el proceso <span>↗</span></button></div><div className="seller-demo-banner-art" aria-hidden="true"><i /><b>01</b><b>02</b><b>03</b></div></div>
          <div className="seller-demo-section-heading"><div><p className="seller-demo-kicker">ÚLTIMOS 30 DÍAS · DATOS ILUSTRATIVOS</p><h2>Tu actividad de un vistazo</h2></div><span>Octubre 2026 ▾</span></div>
          <div className="seller-demo-kpis"><article><span>Ventas totales</span><strong>86</strong><small><b>↗ 18,2%</b> vs. período anterior</small></article><article><span>Ingresos brutos</span><strong>$1.023.400</strong><small><b>↗ 12,8%</b> vs. período anterior</small></article><article><span>Lectores nuevos</span><strong>72</strong><small><b>↗ 9,4%</b> vs. período anterior</small></article><article><span>Tasa de conversión</span><strong>4,8%</strong><small><b>↗ 0,6 pts</b> vs. período anterior</small></article></div>
          <div className="seller-demo-two-col"><section className="seller-demo-panel"><div className="seller-demo-panel-head"><div><p className="seller-demo-kicker">RENDIMIENTO</p><h3>Ventas en el tiempo</h3></div><span>12 semanas</span></div><div className="seller-demo-chart" role="img" aria-label="Gráfico ilustrativo de ventas crecientes durante 12 semanas">{chart.map((height, i) => <div key={i}><span style={{ height: `${height}%` }} /></div>)}</div><div className="seller-demo-chart-labels"><span>AGO</span><span>SEP</span><span>OCT</span></div></section><section className="seller-demo-panel"><div className="seller-demo-panel-head"><div><p className="seller-demo-kicker">PUBLICACIONES</p><h3>Estado de tus ebooks</h3></div><button type="button" onClick={() => setView("libros")}>Ver todos ↗</button></div><div className="seller-demo-status-list">{books.slice(0, 3).map((book) => <div key={book.id}><Cover book={book} /><span><strong>{book.title}</strong><small>{book.category}</small></span><em className={book.status === "Publicado" ? "published" : book.status === "En revisión" ? "review" : "draft"}>{book.status}</em></div>)}</div></section></div>
        </>}

        {view === "libros" && <><div className="seller-demo-pagehead"><div><p className="seller-demo-kicker">TU CATÁLOGO</p><h1>Mis ebooks<span>.</span></h1><p>Gestiona borradores, revisiones y títulos publicados.</p></div><button type="button" className="seller-demo-primary" onClick={() => setEditing("new")}>+ Crear nuevo ebook</button></div><div className="seller-demo-subnav"><strong>Todos los libros <span>{books.length}</span></strong><span>Publicado {books.filter((book) => book.status === "Publicado").length}</span><span>En revisión {books.filter((book) => book.status === "En revisión").length}</span><span>Borrador {books.filter((book) => book.status === "Borrador").length}</span></div><div className="seller-demo-bookgrid">{books.map((book) => <article key={book.id} className="seller-demo-bookcard"><Cover book={book} large /><div><p className="seller-demo-kicker">{book.category.toUpperCase()}</p><h2>{book.title}</h2><p>{book.subtitle}</p><div className="seller-demo-bookmeta"><span>{money(book.price)} CLP</span><em className={book.status === "Publicado" ? "published" : book.status === "En revisión" ? "review" : "draft"}>{book.status}</em></div><div className="seller-demo-bookactions"><button type="button" onClick={() => { setEditing(book.id); setPrice(String(book.price)); }}>Editar</button>{book.status === "Borrador" && <button type="button" onClick={() => submitReview(book.id)}>Simular envío ↗</button>}</div></div></article>)}</div></>}

        {view === "ventas" && <><div className="seller-demo-pagehead"><div><p className="seller-demo-kicker">RENDIMIENTO · DATOS ILUSTRATIVOS</p><h1>Ventas<span>.</span></h1><p>Una vista de cómo seguirás cada compra y tus ingresos.</p></div><button type="button" className="seller-demo-outline" onClick={() => setView("calculadora")}>Ver simulador ↗</button></div><div className="seller-demo-kpis seller-demo-kpis-three"><article><span>Ventas completadas</span><strong>86</strong><small>En los últimos 30 días</small></article><article><span>Total vendido</span><strong>$1.023.400</strong><small>Precio final pagado por lectores</small></article><article><span>Libro más vendido</span><strong>IA para equipos</strong><small>86 ejemplares · datos de muestra</small></article></div><section className="seller-demo-panel seller-demo-orders"><div className="seller-demo-panel-head"><div><p className="seller-demo-kicker">ACTIVIDAD RECIENTE</p><h3>Últimas compras</h3></div><span>Ejemplos, sin pagos reales</span></div><div className="seller-demo-tablewrap"><table><thead><tr><th>Pedido</th><th>Ebook</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead><tbody>{[["#DEM-0048", "IA para equipos", "12 oct 2026", "$11.900"], ["#DEM-0047", "IA para equipos", "10 oct 2026", "$11.900"], ["#DEM-0046", "IA para equipos", "08 oct 2026", "$11.900"], ["#DEM-0045", "IA para equipos", "06 oct 2026", "$11.900"]].map((order) => <tr key={order[0]}><td>{order[0]}</td><td>{order[1]}</td><td>{order[2]}</td><td>{order[3]}</td><td><em className="published">Completado</em></td></tr>)}</tbody></table></div></section><p className="seller-demo-footnote">Este panel ilustra la experiencia de ventas. No representa transacciones efectuadas ni saldos exigibles.</p></>}

        {view === "calculadora" && <><div className="seller-demo-pagehead"><div><p className="seller-demo-kicker">PLANIFICA TU PRECIO</p><h1>Simulador<span>.</span></h1><p>Ajusta el precio final de tu ebook y explora un escenario de ingresos.</p></div></div><div className="seller-demo-simulator"><label htmlFor="seller-demo-price">Precio de venta al público</label><div className="seller-demo-pricefield"><span>$</span><input id="seller-demo-price" type="number" min="500" max="10000000" step="1" value={price} onChange={(event) => setPrice(event.target.value)} /><span>CLP</span></div><PayoutCalculator priceValue={price} /></div></>}

        {view === "configuracion" && <><div className="seller-demo-pagehead"><div><p className="seller-demo-kicker">TU ESPACIO</p><h1>Perfil de autora<span>.</span></h1><p>Así se presentaría tu perfil y el proceso de publicación.</p></div></div><div className="seller-demo-two-col"><section className="seller-demo-panel seller-demo-profile"><span className="seller-demo-profile-avatar">AM</span><p className="seller-demo-kicker">AUTORA VERIFICADA · DEMO</p><h2>Andrea Muñoz</h2><p>Escribo sobre herramientas de IA y decisiones basadas en datos para equipos que quieren trabajar mejor.</p><div><span>Área principal</span><strong>Inteligencia artificial</strong></div><div><span>País y moneda</span><strong>Chile · CLP</strong></div><div><span>Situación tributaria</span><strong>Ejemplo verificado</strong></div></section><section className="seller-demo-panel seller-demo-steps"><p className="seller-demo-kicker">CÓMO FUNCIONA</p><h2>De la idea a la tienda</h2>{[["01", "Crea tu perfil", "Declara tus datos de autor y antecedentes tributarios."], ["02", "Prepara tu ebook", "Añade título, descripción, portada, PDF y precio final."], ["03", "Revisión editorial", "El equipo revisa contenido, derechos y requisitos antes de publicar."], ["04", "Vende y aprende", "Sigue ventas, descubre oportunidades y mejora tu catálogo."]].map(([number, title, detail]) => <div key={number}><b>{number}</b><span><strong>{title}</strong><small>{detail}</small></span></div>)}</section></div><div className="seller-demo-compliance"><strong>Antes de operar con ventas reales</strong><p>La revisión tributaria, la emisión de documentos, el costo de la pasarela y las liquidaciones deben quedar configurados y aprobados. Esta demo no emite boletas ni procesa pagos.</p><Link href="/ebooks/vender/condiciones">Ver condiciones para autores ↗</Link></div></>}
      </div>
    </div>

    {editing !== null && <div className="seller-demo-modal-backdrop" onClick={() => setEditing(null)}><section ref={dialogRef} className="seller-demo-modal" role="dialog" aria-modal="true" aria-labelledby="seller-demo-modal-title" aria-describedby="seller-demo-modal-description" onClick={(event) => event.stopPropagation()}><button ref={closeRef} type="button" className="seller-demo-modal-close" aria-label="Cerrar" onClick={() => setEditing(null)}>×</button><p className="seller-demo-kicker">EDITOR DE DEMOSTRACIÓN</p><h2 id="seller-demo-modal-title">{activeBook ? "Editar ebook" : "Nuevo ebook"}</h2><p id="seller-demo-modal-description">Los cambios se muestran solo en tu navegador durante esta visita.</p><form onSubmit={saveBook}><label>Título del ebook<input name="title" required minLength={3} maxLength={180} defaultValue={activeBook?.title} placeholder="Ej.: IA aplicada a mi negocio" /></label><label>Subtítulo<input name="subtitle" maxLength={160} defaultValue={activeBook?.subtitle} placeholder="Una frase que explique el beneficio" /></label><label>Categoría<select name="category" defaultValue={activeBook?.category ?? "Inteligencia artificial"}><option>Inteligencia artificial</option><option>Tecnología</option><option>Negocios</option></select></label><label>Precio final en CLP<input name="price" type="number" min="500" max="10000000" step="1" required defaultValue={activeBook?.price ?? 11900} /></label><div className="seller-demo-upload-note"><span>↑</span><div><strong>Portada y PDF</strong><p>En una cuenta real se suben como archivos privados antes de solicitar revisión. La demo no carga archivos.</p></div></div><button type="submit" className="seller-demo-primary">Guardar borrador</button></form></section></div>}
  </main>;
}
