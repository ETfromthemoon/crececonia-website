"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";
import InviteAuthor from "@/components/marketplace/InviteAuthor";
import SellerDemo from "./SellerDemo";
import styles from "./seller-panel.module.css";

type Seller = { id: string; display_name: string; public_slug: string; bio: string; status: string };
type TaxProfile = { rut: string; legal_name: string; declared_vat_status: string; review_status: string };
type Book = { id: string; revision_id?: string; slug: string; status: string; title: string; description: string; category: string; price_minor: number; has_pdf: boolean; has_cover: boolean };
type SalesSummary = { sale_count: number; gross_minor: string; commission_minor: string };
type PayoutBalance = { ledger_net_minor: string; settled_minor: string; available_minor: string; blocked: boolean };
type SellerSale = { order_item_id: string; order_id: string; title: string; price_minor: string; commission_minor: string; gateway_fee_actual_minor: string | null; seller_net_minor: string | null; paid_at: string };
const formatCLP = (amount: string | bigint) => `$${new Intl.NumberFormat("es-CL").format(BigInt(amount))} CLP`;
const bookStates: Record<string, string> = {
  draft: "Borrador", in_review: "En revisión", changes_requested: "Cambios solicitados",
  approved: "Aprobado", published: "Publicado", paused: "Pausado", archived: "Archivado",
};
const tabs = [
  ["libros", "Mis ebooks", "▤"], ["ventas", "Ventas", "▥"],
  ["liquidaciones", "Liquidaciones", "◈"], ["perfil", "Mi perfil", "◎"],
] as const;
type View = (typeof tabs)[number][0];
const sampleSeller: Seller = { id: "sample", display_name: "Andrea Muñoz", public_slug: "andrea", bio: "Autora de ejemplo", status: "active" };
const sampleBook: Book = { id: "sample", slug: "ia-para-equipos", status: "published", title: "IA para equipos", description: "Ejemplo de un ebook publicado.", category: "ia", price_minor: 11900, has_pdf: true, has_cover: true };
const sampleSummary: SalesSummary = { sale_count: 1, gross_minor: "11900", commission_minor: "595" };
const emptySummary: SalesSummary = { sale_count: 0, gross_minor: "0", commission_minor: "0" };
const sampleSale: SellerSale = { order_item_id: "sample", order_id: "sample", title: sampleBook.title, price_minor: "11900", commission_minor: "595", gateway_fee_actual_minor: "350", seller_net_minor: "10955", paid_at: "2026-11-18T15:00:00Z" };
const sampleBalance: PayoutBalance = { ledger_net_minor: "10955", settled_minor: "0", available_minor: "10955", blocked: false };

const inputStyle = { display: "block", width: "100%", margin: "8px 0 18px", padding: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" };

async function post(path: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  if (!response.ok) throw new Error(await response.text());
}

export default function SellerPortal({ demoAvailable, showRegistration = false, showPanelPreview = false }: {
  demoAvailable: boolean; showRegistration?: boolean; showPanelPreview?: boolean;
}) {
  const panelPreview = demoAvailable && showPanelPreview;
  const [loading, setLoading] = useState(!demoAvailable);
  const [loggedIn, setLoggedIn] = useState(panelPreview);
  const [demoMode, setDemoMode] = useState(demoAvailable && !showRegistration && !panelPreview);
  const [view, setView] = useState<View>("libros");
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [seller, setSeller] = useState<Seller | null>(panelPreview ? sampleSeller : null);
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [books, setBooks] = useState<Book[]>(panelPreview ? [sampleBook] : []);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>(panelPreview ? sampleSummary : emptySummary);
  const [recentSales, setRecentSales] = useState<SellerSale[]>(panelPreview ? [sampleSale] : []);
  const [payoutBalance, setPayoutBalance] = useState<PayoutBalance | null>(panelPreview ? sampleBalance : null);
  const [message, setMessage] = useState("");
  const [pricePreview, setPricePreview] = useState("");
  const [revisionPrices, setRevisionPrices] = useState<Record<string, string>>({});

  async function refresh() {
    try {
      const response = await fetch("/api/marketplace/seller/dashboard", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok && response.status !== 401) throw new Error();
      setLoggedIn(response.ok);
      if (response.ok) {
        const data = await response.json() as { seller: Seller | null; taxProfile: TaxProfile | null; books: Book[]; salesSummary: SalesSummary; recentSales: SellerSale[]; payoutBalance: PayoutBalance | null };
        setSeller(data.seller);
        setTaxProfile(data.taxProfile);
        setBooks(data.books);
        setSalesSummary(data.salesSummary);
        setRecentSales(data.recentSales);
        setPayoutBalance(data.payoutBalance);
      }
    } catch { setMessage("No pudimos cargar el panel. Actualiza la página e inténtalo de nuevo."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!demoAvailable) void refresh(); else setLoading(false); }, [demoAvailable]);

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestingAccess) return;
    const email = String(new FormData(event.currentTarget).get("email")).trim().toLowerCase();
    setMessage("");
    setSubmittedEmail("");
    setRequestingAccess(true);
    try {
      if (!demoAvailable) {
        const response = await fetch("/api/marketplace/seller/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.status === 429) {
          setMessage("Alcanzaste el límite temporal de solicitudes. Revisa los enlaces anteriores o vuelve a intentarlo en una hora.");
          return;
        }
        if (!response.ok) throw new Error();
      }
      setSubmittedEmail(email);
    } catch {
      setMessage("No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.");
    } finally {
      setRequestingAccess(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>, path: string, success: string, method: "POST" | "PATCH" = "POST") {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const body: Record<string, unknown> = { ...values };
    if (path.endsWith("/profile")) body.acceptTerms = values.acceptTerms === "on";
    if (path.includes("/books")) { body.declareRights = values.declareRights === "on"; body.priceClp = Number(values.priceClp); }
    try {
      await post(path, body, method);
      setMessage(success);
      form.reset();
      if (path === "/api/marketplace/seller/books") setPricePreview("");
      if (method === "PATCH" && path.includes("/books/")) {
        const bookId = path.split("/").at(-1);
        if (bookId) setRevisionPrices((prices) => {
          const next = { ...prices };
          delete next[bookId];
          return next;
        });
      }
      await refresh();
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos guardar los datos."); }
  }

  async function upload(event: FormEvent<HTMLFormElement>, bookId: string, kind: "ebook_pdf" | "cover") {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 4 * 1024 * 1024) {
      setMessage(`El ${kind === "ebook_pdf" ? "PDF" : "archivo de portada"} debe pesar como máximo 4 MiB.`);
      return;
    }
    try {
      const response = await fetch(`/api/marketplace/seller/books/${bookId}/assets`, { method: "POST", body: form, credentials: "same-origin" });
      setMessage(response.ok ? "Archivo recibido para revisión." : await response.text());
      if (response.ok) await refresh();
    } catch { setMessage("No pudimos subir el archivo. Inténtalo nuevamente."); }
  }

  async function sendForReview(bookId: string) {
    try {
      const response = await fetch(`/api/marketplace/seller/books/${bookId}/submit`, { method: "POST", credentials: "same-origin" });
      setMessage(response.ok ? "Libro enviado a revisión editorial." : await response.text());
      if (response.ok) await refresh();
    } catch { setMessage("No pudimos enviar el libro a revisión."); }
  }

  function signOut() {
    void post("/api/marketplace/seller/logout", {}).then(() => window.location.reload())
      .catch(() => setMessage("No pudimos cerrar la sesión. Inténtalo de nuevo."));
  }

  if (demoMode) return <SellerDemo onExit={() => { setDemoMode(false); setLoggedIn(false); setSeller(null); setTaxProfile(null); setBooks([]); }} />;

  if (loading || !loggedIn || !seller) return <main className={styles.access}>
    <div className={styles.accessCard}>
    <Link href="/ebooks/mercado" className={styles.back}>← Volver al Marketplace</Link>
    <p className="eyebrow">Marketplace de ebooks</p>
    <h1>Espacio de autores</h1>
    <p>Publica ebooks sobre IA, tecnología y negocios. Tu perfil y cada libro pasan por revisión antes de aparecer en la tienda.</p>
    {message && <p role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>{message}</p>}
    {loading ? <p>Cargando…</p> : !loggedIn ? <form onSubmit={requestAccess}>
      <h2>Crea tu cuenta o inicia sesión</h2>
      {demoAvailable && <p>Preview del registro. Puedes usar un correo de ejemplo. Aquí no se envían mensajes ni se crean cuentas.</p>}
      <label htmlFor="seller-email">Tu correo electrónico</label>
      <input id="seller-email" name="email" type="email" autoComplete="email" maxLength={320} required style={inputStyle} />
      <button type="submit" className="button button-dark" disabled={requestingAccess}>
        {requestingAccess ? "Solicitando enlace…" : submittedEmail ? "Pedir otro enlace" : "Recibir enlace de acceso"}
      </button>
      {submittedEmail && <div role="status" style={{ marginTop: 24 }}>
        <h3>{demoAvailable ? "Confirmación de ejemplo" : "Revisa tu correo"}</h3>
        <p>Busca en <strong>{submittedEmail}</strong> el mensaje «Accede a tu espacio de autor en CrececonIA». El enlace dura 15 minutos. Si no lo ves, revisa spam y verifica que el correo esté bien escrito.</p>
      </div>}
      {demoAvailable && <p><button type="button" className="button button-dark" onClick={() => setDemoMode(true)}>
        {submittedEmail ? "Simular confirmación y entrar" : "Entrar directo a la demo"}
      </button></p>}
    </form> : !seller ? <section>
      <h2>Crea tu perfil público</h2>
      <form onSubmit={(event) => void submit(event, "/api/marketplace/seller/profile", "Perfil enviado para verificación.")}>
        <label htmlFor="seller-name">Nombre público</label><input id="seller-name" name="displayName" required minLength={2} maxLength={120} style={inputStyle} />
        <label htmlFor="seller-slug">Identificador público (letras minúsculas y guiones)</label><input id="seller-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} style={inputStyle} />
        <label htmlFor="seller-bio">Presentación</label><textarea id="seller-bio" name="bio" maxLength={2000} rows={4} style={inputStyle} />
        <h3>Datos tributarios para revisión</h3>
        <p>Estos datos no habilitan ventas automáticamente. El equipo validará tu situación tributaria antes de publicar.</p>
        <label htmlFor="seller-legal-name">Nombre o razón social</label><input id="seller-legal-name" name="legalName" required minLength={3} maxLength={160} style={inputStyle} />
        <label htmlFor="seller-rut">RUT</label><input id="seller-rut" name="rut" required maxLength={12} placeholder="12345678-9" style={inputStyle} />
        <label htmlFor="seller-vat">Situación de IVA que declaras</label><select id="seller-vat" name="vatStatus" style={inputStyle}><option value="unsure">No estoy seguro/a</option><option value="vat_registered">Contribuyente de IVA</option><option value="not_registered">No inscrito/a como contribuyente de IVA</option></select>
        <label><input name="acceptTerms" type="checkbox" required /> Leí y acepto las <a href="/ebooks/vender/condiciones" target="_blank" rel="noopener noreferrer">condiciones para autores</a> y declaro que mis datos son correctos.</label>
        <p><button type="submit" className="button button-dark">Crear perfil</button></p>
      </form>
      <button type="button" className={styles.back} onClick={signOut}>Cerrar sesión</button>
    </section> : null}
    </div>
  </main>;

  const sellerStatus = seller.status === "active" ? "Verificado" : seller.status === "rejected" ? "Rechazado" : seller.status === "suspended" ? "Suspendido" : "En verificación";
  const activeTab = tabs.find(([id]) => id === view)?.[1];
  function changeView(next: View) {
    setView(next);
    window.scrollTo(0, 0);
  }

  return <main className={`seller-demo ${styles.workspace}`}>
    <aside className={`seller-demo-sidebar ${styles.sidebar}`}>
      <Link href="/ebooks/mercado" className="seller-demo-brand">
        <span className="seller-demo-brand-icon" aria-hidden="true">C</span>
        <span>CRECECONIA<small>MARKETPLACE</small></span>
      </Link>
      <div className={styles.identity}><strong>{seller.display_name}</strong><span>{sellerStatus}</span></div>
      <nav className={styles.navigation} aria-label="Secciones del panel de autores">
        {tabs.map(([id, label, icon]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => changeView(id)}>
          <span aria-hidden="true">{icon}</span>{label}
        </button>)}
      </nav>
      <div className={styles.sidebarActions}>
        <Link href="/ebooks/mercado">Ver tienda ↗</Link>
        {panelPreview ? <Link href="/ebooks/vender">Volver a la demo</Link>
          : <button type="button" onClick={signOut}>Cerrar sesión</button>}
      </div>
    </aside>
    <div className="seller-demo-main">
      <div className={styles.topbar}>Marketplace / {activeTab}</div>
      <div className={`seller-demo-content ${styles.content}`}>
      {panelPreview && <p className={styles.notice}>Vista previa con datos de ejemplo. Las cifras y el ebook son ilustrativos.</p>}
      {message && <p role="status" className={styles.notice}>{message}</p>}
      <section hidden={view !== "perfil"} className={styles.section} aria-labelledby="perfil-title">
      <header className={styles.heading}><h1 id="perfil-title">Mi perfil</h1><p>Identidad, estado de verificación y datos tributarios.</p></header>
      <div className={styles.panel}>
      <p><strong>{seller.display_name}</strong> · {sellerStatus}</p>
      <InviteAuthor />
      <p>Revisión tributaria: {panelPreview || taxProfile?.review_status === "verified" ? "Verificada" : taxProfile?.review_status === "rejected" ? "Rechazada: corrige tus datos para volver a solicitar revisión" : "Pendiente"}</p>
      {taxProfile?.review_status === "rejected" && <section>
        <h2>Corregir perfil tributario</h2>
        <form onSubmit={(event) => void submit(event, "/api/marketplace/seller/profile", "Datos tributarios reenviados para verificación.", "PATCH")}>
          <label>Nombre público <input name="displayName" defaultValue={seller.display_name} required minLength={2} maxLength={120} style={inputStyle} /></label>
          <label>Identificador público <input name="slug" defaultValue={seller.public_slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} style={inputStyle} /></label>
          <label>Presentación <textarea name="bio" defaultValue={seller.bio} maxLength={2000} rows={4} style={inputStyle} /></label>
          <label>Nombre o razón social <input name="legalName" defaultValue={taxProfile.legal_name} required minLength={3} maxLength={160} style={inputStyle} /></label>
          <label>RUT <input name="rut" defaultValue={taxProfile.rut} required maxLength={12} style={inputStyle} /></label>
          <label>Situación de IVA <select name="vatStatus" defaultValue={taxProfile.declared_vat_status} style={inputStyle}><option value="unsure">No estoy seguro/a</option><option value="vat_registered">Contribuyente de IVA</option><option value="not_registered">No inscrito/a como contribuyente de IVA</option></select></label>
          <label><input name="acceptTerms" type="checkbox" required /> Confirmo los datos y acepto las <a href="/ebooks/vender/condiciones" target="_blank" rel="noopener noreferrer">condiciones para autores</a>.</label>
          <p><button type="submit">Enviar corrección</button></p>
        </form>
      </section>}
      </div>
      </section>
      <section hidden={view !== "libros"} className={styles.section} aria-labelledby="ebooks-title">
      <header className={styles.heading}><div><h1 id="ebooks-title">Mis ebooks</h1><p>Crea borradores, carga archivos y sigue el estado de cada libro.</p></div>
        {!panelPreview && <a className="seller-demo-primary" href="#nuevo-ebook">Crear ebook</a>}
      </header>
      {books.length ? <ul className={styles.records}>{books.map((book) => <li key={book.id} className={styles.panel}>
        <div className={styles.bookTitle}><h2>{book.title ?? book.slug}</h2><span className={styles.badge}>{bookStates[book.status] ?? book.status}</span></div>
        <p>{book.price_minor == null ? "Precio pendiente" : formatCLP(String(book.price_minor))} · {book.has_pdf ? "PDF cargado" : "Falta PDF"} · {book.has_cover ? "Portada cargada" : "Falta portada"}</p>
        {(book.status === "draft" || book.status === "changes_requested") && <details open={book.status === "changes_requested"}>
          <summary>{book.status === "draft" ? "Editar borrador" : "Responder a la revisión"}</summary>
          <form key={`${book.id}:${book.revision_id}`} onSubmit={(event) => void submit(event, `/api/marketplace/seller/books/${book.id}`, "Nueva revisión guardada. Sube el PDF y la portada a esta versión antes de enviarla.", "PATCH")}>
          <p>Al guardar se crea una versión nueva. Después deberás subir su PDF y portada, aunque ya hayas subido archivos a la versión anterior.</p>
          <label>Título <input name="title" defaultValue={book.title} required minLength={3} maxLength={180} style={inputStyle} /></label>
          <label>Descripción <textarea name="description" defaultValue={book.description} required minLength={20} maxLength={10000} rows={6} style={inputStyle} /></label>
          <label>Categoría <select name="category" defaultValue={book.category} style={inputStyle}><option value="ia">IA</option><option value="tecnologia">Tecnología</option><option value="negocios">Negocios</option></select></label>
          <label>Precio en CLP <input name="priceClp" type="number" value={revisionPrices[book.id] ?? String(book.price_minor)} onChange={(event) => setRevisionPrices((prices) => ({ ...prices, [book.id]: event.target.value }))} min={500} max={10000000} step={1} required style={inputStyle} /></label>
          <PayoutCalculator priceValue={revisionPrices[book.id] ?? String(book.price_minor)} />
          <label><input name="declareRights" type="checkbox" required /> Confirmo que tengo los derechos de la versión corregida.</label>
          <p><button type="submit">Guardar nueva revisión</button></p>
        </form></details>}
        {book.status === "draft" && <div>
          <form onSubmit={(event) => void upload(event, book.id, "ebook_pdf")}><input type="hidden" name="kind" value="ebook_pdf" /><label>PDF privado (hasta 4 MiB) <input name="file" type="file" accept="application/pdf" required /></label> <button type="submit">{book.has_pdf ? "Reemplazar PDF" : "Subir PDF"}</button></form>
          <form onSubmit={(event) => void upload(event, book.id, "cover")}><input type="hidden" name="kind" value="cover" /><label>Portada JPG o PNG (hasta 4 MiB) <input name="file" type="file" accept="image/jpeg,image/png" required /></label> <button type="submit">{book.has_cover ? "Reemplazar portada" : "Subir portada"}</button></form>
          <button type="button" disabled={!book.has_pdf || !book.has_cover} onClick={() => void sendForReview(book.id)}>Enviar a revisión</button>
        </div>}
      </li>)}</ul> : <p className={styles.panel}>Aún no tienes ebooks. Puedes empezar con un borrador.</p>}
      {!panelPreview && <section id="nuevo-ebook" className={styles.panel}><h2>Crear borrador</h2>
      <form onSubmit={(event) => void submit(event, "/api/marketplace/seller/books", "Borrador guardado. La publicación requiere portada, PDF y aprobación editorial.")}>
        <label htmlFor="book-title">Título</label><input id="book-title" name="title" required minLength={3} maxLength={180} style={inputStyle} />
        <label htmlFor="book-slug">Identificador del libro</label><input id="book-slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} style={inputStyle} />
        <label htmlFor="book-description">Descripción (mínimo 20 caracteres)</label><textarea id="book-description" name="description" required minLength={20} maxLength={10000} rows={6} style={inputStyle} />
        <label htmlFor="book-category">Categoría</label><select id="book-category" name="category" style={inputStyle}><option value="ia">IA</option><option value="tecnologia">Tecnología</option><option value="negocios">Negocios</option></select>
        <label htmlFor="book-price">Precio en pesos chilenos, IVA por definir en revisión</label><input id="book-price" name="priceClp" type="number" min={500} max={10000000} step={1} required value={pricePreview} onChange={(event) => setPricePreview(event.target.value)} aria-describedby="book-price-help" style={inputStyle} />
        <p id="book-price-help">El cálculo siguiente usa supuestos ilustrativos. El tratamiento tributario aplicable se confirma durante la revisión.</p>
        <PayoutCalculator priceValue={pricePreview} />
        <label><input name="declareRights" type="checkbox" required /> Declaro que tengo los derechos para vender este ebook.</label>
        <p><button type="submit" className="button button-dark">Guardar borrador</button></p>
      </form>
      </section>}
      </section>
      <section hidden={view !== "ventas"} className={styles.section} aria-labelledby="seller-sales-heading">
        <header className={styles.heading}><h1 id="seller-sales-heading">Ventas confirmadas</h1><p>Últimas 20 ventas pagadas de tus ebooks.</p></header>
        <dl className={styles.metrics}>
          <div><dt>Ventas pagadas</dt><dd>{salesSummary.sale_count}</dd></div>
          <div><dt>Total bruto pagado</dt><dd>{formatCLP(salesSummary.gross_minor)}</dd></div>
          <div><dt>Comisión CrececonIA</dt><dd>{formatCLP(salesSummary.commission_minor)}</dd></div>
          <div><dt>Después de comisión, antes de otros cargos</dt><dd>{formatCLP(BigInt(salesSummary.gross_minor) - BigInt(salesSummary.commission_minor))}</dd></div>
        </dl>
        {recentSales.length > 0 ? <div className={styles.records}>{recentSales.map((sale) => <article className={styles.panel} key={sale.order_item_id}>
          <div className={styles.bookTitle}><h2>{sale.title}</h2><time dateTime={sale.paid_at}>{new Date(sale.paid_at).toLocaleDateString("es-CL", { timeZone: "America/Santiago" })}</time></div>
          <dl className={styles.saleDetails}>
            <div><dt>Precio cobrado</dt><dd>{formatCLP(sale.price_minor)}</dd></div>
            <div><dt>Comisión CrececonIA</dt><dd>{formatCLP(sale.commission_minor)}</dd></div>
            <div><dt>Tarifa Flow</dt><dd>{sale.gateway_fee_actual_minor === null ? "Por conciliar" : formatCLP(sale.gateway_fee_actual_minor)}</dd></div>
            <div><dt>Neto contable</dt><dd>{sale.seller_net_minor === null ? "Por conciliar" : formatCLP(sale.seller_net_minor)}</dd></div>
          </dl>
        </article>)}</div> : <p className={styles.panel}>Aún no hay ventas confirmadas de tus ebooks.</p>}
      </section>
      <section hidden={view !== "liquidaciones"} className={styles.section} aria-labelledby="seller-payout-heading">
        <header className={styles.heading}><h1 id="seller-payout-heading">Liquidaciones</h1><p>Revisa tus ingresos devengados, transferencias registradas y saldo disponible.</p></header>
        <dl className={styles.metrics}>
          <div><dt>Devengado</dt><dd>{payoutBalance ? formatCLP(payoutBalance.ledger_net_minor) : "—"}</dd></div>
          <div><dt>Ya transferido</dt><dd>{payoutBalance ? formatCLP(payoutBalance.settled_minor) : "—"}</dd></div>
          <div><dt>Disponible para transferir</dt><dd>{payoutBalance && !payoutBalance.blocked && BigInt(payoutBalance.available_minor) >= BigInt(0) ? formatCLP(payoutBalance.available_minor) : "—"}</dd></div>
        </dl>
        {!payoutBalance && <p className={styles.panel}>Todavía no hay liquidaciones para esta cuenta.</p>}
        {payoutBalance?.blocked && <p role="status" className={styles.notice}>Saldo en conciliación. Puede haber comprobantes, cargos de Flow o reembolsos pendientes.</p>}
        {payoutBalance && BigInt(payoutBalance.available_minor) < BigInt(0) && <p role="status" className={styles.notice}>El saldo requiere revisión por ajustes o reembolsos.</p>}
        <p className={styles.panel}>El equipo registra manualmente las transferencias. El saldo contable no descuenta automáticamente el IVA de la venta.</p>
      </section>
      </div>
    </div>
  </main>;
}
