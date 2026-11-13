"use client";

import { useState } from "react";
import styles from "./demo.module.css";

type ReviewStatus = "pendiente" | "aprobado" | "cambios";
type QueueItem = {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  submitted: string;
  kind: "Libro" | "Autor";
  summary: string;
  checks: { label: string; done: boolean }[];
  color: string;
};

const seed: QueueItem[] = [
  { id: "libro-1", title: "IA aplicada a equipos", author: "Valentina Rojas", category: "Inteligencia artificial", price: 11900, submitted: "Hoy · 09:42", kind: "Libro", summary: "Una guía práctica para diseñar procesos, elegir herramientas y medir el impacto de la IA en equipos de trabajo.", checks: [{ label: "Identidad del autor", done: true }, { label: "Derechos declarados", done: true }, { label: "PDF revisado", done: true }, { label: "Tratamiento tributario", done: true }], color: "violet" },
  { id: "libro-2", title: "Negocios con datos", author: "Ignacio Torres", category: "Negocios", price: 9900, submitted: "Ayer · 16:18", kind: "Libro", summary: "Cómo construir un tablero de decisiones y transformar métricas en experimentos comerciales medibles.", checks: [{ label: "Identidad del autor", done: true }, { label: "Derechos declarados", done: true }, { label: "PDF revisado", done: false }, { label: "Tratamiento tributario", done: true }], color: "amber" },
  { id: "autor-1", title: "Camila Fuentes", author: "Autora nueva", category: "Perfil de vendedor", price: 0, submitted: "Ayer · 11:05", kind: "Autor", summary: "Consultora en automatización de procesos. Solicita publicar contenidos sobre IA, tecnología y negocios.", checks: [{ label: "Identidad y RUT", done: true }, { label: "Términos aceptados", done: true }, { label: "Perfil tributario", done: false }, { label: "Contenido declarado", done: true }], color: "teal" },
];

const money = (amount: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);

export default function DemoMarketplaceAdmin() {
  const [view, setView] = useState<"resumen" | "revision" | "ventas">("resumen");
  const [selectedId, setSelectedId] = useState(seed[0].id);
  const [decisions, setDecisions] = useState<Record<string, ReviewStatus>>({});
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const selected = seed.find((item) => item.id === selectedId) ?? seed[0];
  const pending = seed.filter((item) => (decisions[item.id] ?? "pendiente") === "pendiente").length;

  function decide(status: ReviewStatus) {
    if (status === "cambios" && note.trim().length < 10) {
      setFeedback("Escribe una observación de al menos 10 caracteres para solicitar cambios.");
      return;
    }
    setDecisions((current) => ({ ...current, [selected.id]: status }));
    setFeedback(status === "aprobado" ? "Aprobación simulada. No se publicó ni modificó ningún dato real." : "Solicitud de cambios simulada. No se envió ningún mensaje real.");
    setNote("");
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Navegación de la demo administrativa">
      <a className={styles.brand} href="/ebooks/mercado"><span className={styles.brandMark}>C<span>.</span></span><span>CRECE CON IA<small>MARKETPLACE STUDIO</small></span></a>
      <p className={styles.sideLabel}>ESPACIO DE TRABAJO</p>
      <nav className={styles.nav} aria-label="Secciones del panel">
        <button className={view === "resumen" ? styles.active : ""} onClick={() => setView("resumen")}><span>◫</span> Resumen</button>
        <button className={view === "revision" ? styles.active : ""} onClick={() => setView("revision")}><span>▤</span> Revisión <b>{pending}</b></button>
        <button className={view === "ventas" ? styles.active : ""} onClick={() => setView("ventas")}><span>↗</span> Ventas y operación</button>
      </nav>
      <div className={styles.sideFooter}><span className={styles.avatar}>CC</span><span>Vista de administrador<small>Datos de demostración</small></span></div>
    </aside>
    <main className={styles.main}>
      <div className={styles.topbar}><span className={styles.breadcrumb}>Marketplace <span>/</span> Administración</span><div><span className={styles.liveDot} /> ENTORNO DE DEMO</div></div>
      <div className={styles.content}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>CENTRO DE OPERACIONES</p><h1>{view === "revision" ? "Mesa de revisión" : view === "ventas" ? "Ventas y operación" : "Tu marketplace, en perspectiva"}</h1><p>Una vista de cómo se supervisan autores, contenido y ventas del marketplace.</p></div><a href="/ebooks/mercado" className={styles.outlineButton}>Ver tienda ↗</a></div>
        <div className={styles.notice}><span>✦</span><p><strong>Demo interactiva.</strong> Puedes explorar y tomar decisiones de ejemplo. Todos los datos son ficticios; nada se guarda, publica, cobra ni envía.</p></div>

        {view === "resumen" && <>
          <div className={styles.metrics}>
            <Metric label="Ventas de ejemplo / 30 días" value="$1.284.500" delta="↗ 18,4 %" detail="CLP · volumen bruto" />
            <Metric label="Comisión Crece con IA" value="$64.225" delta="5 %" detail="Antes de impuestos y pasarela" />
            <Metric label="Libros publicados" value="24" delta="+3 este mes" detail="IA, tecnología y negocios" />
            <Metric label="En revisión" value={String(pending).padStart(2, "0")} delta="Requieren atención" detail="Autores y ebooks" />
          </div>
          <div className={styles.twoColumns}>
            <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>ACTIVIDAD COMERCIAL</p><h2>Ventas de los últimos 7 días</h2></div><span className={styles.panelHint}>Muestra</span></div><div className={styles.chart} aria-label="Gráfico de barras de ventas de ejemplo durante siete días">{[46, 62, 38, 82, 56, 100, 73].map((height, index) => <div key={index} className={styles.chartCol}><div style={{ height: `${height}%` }} /><span>{["L", "M", "M", "J", "V", "S", "D"][index]}</span></div>)}</div><div className={styles.chartFooter}><span>142 compras de ejemplo</span><strong>Ticket medio $9.045</strong></div></section>
            <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>CONTROL EDITORIAL</p><h2>Necesitan tu atención</h2></div><button className={styles.textButton} onClick={() => setView("revision")}>Ver cola →</button></div><div className={styles.activityList}>{seed.filter((item) => (decisions[item.id] ?? "pendiente") === "pendiente").map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setView("revision"); }}><span className={`${styles.miniCover} ${styles[item.color]}`}>{item.kind === "Libro" ? "▤" : "◉"}</span><span><strong>{item.title}</strong><small>{item.kind} · {item.author}</small></span><span className={styles.arrow}>↗</span></button>)}{pending === 0 && <p className={styles.empty}>Revisaste todos los ejemplos de la cola.</p>}</div></section>
          </div>
          <div className={styles.twoColumns}><section className={styles.panel}><p className={styles.eyebrow}>DESCUBRIMIENTO</p><h2>De la visita a la compra</h2><div className={styles.funnel}><span>Visitas a la tienda <strong>4.820</strong></span><span>Vistas de libro <strong>1.940</strong></span><span>Inicio de compra <strong>391</strong></span><span>Compras <strong>142</strong></span></div><p className={styles.muted}>Datos de muestra para recorrer el embudo. No representan rendimiento real.</p></section><section className={styles.panel}><p className={styles.eyebrow}>SIGUIENTES PASOS</p><h2>Preparación para operar</h2><ul className={styles.checklist}><li><span>✓</span> Revisión editorial antes de publicar</li><li><span>✓</span> Simulador de liquidación para autores</li><li><span>○</span> Validar tributación y emisión DTE con especialista</li><li><span>○</span> Verificar flujo de pago y entrega en entorno real</li></ul></section></div>
        </>}

        {view === "revision" && <div className={styles.reviewGrid}><section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.eyebrow}>COLA EDITORIAL</p><h2>{pending} expedientes pendientes</h2></div><span className={styles.panelHint}>Ejemplos</span></div><div className={styles.reviewList}>{seed.map((item) => <button key={item.id} onClick={() => { setSelectedId(item.id); setFeedback(""); setNote(""); }} className={selectedId === item.id ? styles.selectedRow : ""}><span className={`${styles.miniCover} ${styles[item.color]}`}>{item.kind === "Libro" ? "▤" : "◉"}</span><span><strong>{item.title}</strong><small>{item.author} · {item.submitted}</small></span><em className={decisions[item.id] === "aprobado" ? styles.approved : decisions[item.id] === "cambios" ? styles.changes : styles.pending}>{decisions[item.id] === "aprobado" ? "Aprobado" : decisions[item.id] === "cambios" ? "Cambios" : "Pendiente"}</em></button>)}</div></section><section className={styles.panel}><div className={styles.reviewType}>{selected.kind.toUpperCase()} <span>·</span> {selected.category}</div><h2 className={styles.reviewTitle}>{selected.title}</h2><p className={styles.muted}>{selected.author} · {selected.submitted}{selected.price > 0 ? ` · ${money(selected.price)}` : ""}</p><p className={styles.summary}>{selected.summary}</p><h3 className={styles.subheading}>Comprobaciones</h3><div className={styles.reviewChecks}>{selected.checks.map((check) => <div key={check.label}><span className={check.done ? styles.doneIcon : styles.todoIcon}>{check.done ? "✓" : "!"}</span><span>{check.label}</span><strong>{check.done ? "Listo" : "Pendiente"}</strong></div>)}</div><label className={styles.noteLabel} htmlFor="demo-review-note">Observación para el autor</label><textarea id="demo-review-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe el cambio solicitado…" /><div className={styles.actions}><button onClick={() => decide("aprobado")} disabled={selected.checks.some((check) => !check.done)}>Aprobar revisión</button><button onClick={() => decide("cambios")}>Solicitar cambios</button></div>{selected.checks.some((check) => !check.done) && <p className={styles.helper}>Para aprobar, todas las comprobaciones deben estar listas. Selecciona “IA aplicada a equipos” para probar la aprobación.</p>}{feedback && <p role="status" className={styles.feedback}>{feedback}</p>}</section></div>}

        {view === "ventas" && <div className={styles.twoColumns}><section className={styles.panel}><p className={styles.eyebrow}>LIQUIDACIONES DE EJEMPLO</p><h2>Distribución por transacción</h2><div className={styles.ledger}><div><span>Precio pagado por el comprador</span><strong>$11.900</strong></div><div><span>Comisión Crece con IA (5 %)</span><strong>−$595</strong></div><div><span>Pasarela de pago</span><strong>Según contrato</strong></div><div><span>IVA y documento tributario</span><strong>Según perfil validado</strong></div></div><p className={styles.muted}>La liquidación definitiva depende de la configuración tributaria aprobada y del costo efectivo de la pasarela.</p></section><section className={styles.panel}><p className={styles.eyebrow}>OPERACIÓN POSTVENTA</p><h2>Una compra, varios controles</h2><ol className={styles.steps}><li>Confirmar pago con el proveedor</li><li>Registrar la venta y su desglose</li><li>Habilitar descarga privada</li><li>Emitir el documento tributario correspondiente</li><li>Gestionar soporte y devoluciones</li></ol><a href="/ebooks/vender" className={styles.textButton}>Ver experiencia del autor →</a></section></div>}
      </div>
    </main>
  </div>;
}

function Metric({ label, value, delta, detail }: { label: string; value: string; delta: string; detail: string }) {
  return <div className={styles.metric}><p>{label}</p><strong>{value}</strong><div><span>{delta}</span><small>{detail}</small></div></div>;
}
