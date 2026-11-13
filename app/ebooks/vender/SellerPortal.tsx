"use client";

import { FormEvent, useEffect, useState } from "react";
import PayoutCalculator from "@/components/marketplace/PayoutCalculator";
import SellerDemo from "./SellerDemo";

type Seller = { id: string; display_name: string; public_slug: string; bio: string; status: string };
type TaxProfile = { rut: string; legal_name: string; declared_vat_status: string; review_status: string };
type Book = { id: string; slug: string; status: string; title: string; description: string; category: string; price_minor: number; has_pdf: boolean; has_cover: boolean };

const inputStyle = { display: "block", width: "100%", margin: "8px 0 18px", padding: 12, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" };

async function post(path: string, body: Record<string, unknown>, method: "POST" | "PATCH" = "POST") {
  const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  if (!response.ok) throw new Error(await response.text());
}

const demoSeller: Seller = { id: "demo", display_name: "Autora de demostración", public_slug: "autora-demo", bio: "Libros de IA aplicada", status: "active" };
const demoBooks: Book[] = [
  { id: "demo-1", slug: "ia-para-equipos", status: "published", title: "IA para equipos", description: "Un ejemplo del catálogo de autores.", category: "ia", price_minor: 11900, has_pdf: true, has_cover: true },
  { id: "demo-2", slug: "negocios-con-datos", status: "in_review", title: "Negocios con datos", description: "Un ejemplo de libro enviado a revisión.", category: "negocios", price_minor: 9900, has_pdf: true, has_cover: true },
];

export default function SellerPortal({ demoAvailable }: { demoAvailable: boolean }) {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [demoMode, setDemoMode] = useState(demoAvailable);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [taxProfile, setTaxProfile] = useState<TaxProfile | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [message, setMessage] = useState("");
  const [pricePreview, setPricePreview] = useState("");
  const [revisionPrices, setRevisionPrices] = useState<Record<string, string>>({});

  async function refresh() {
    try {
      const response = await fetch("/api/marketplace/seller/dashboard", { credentials: "same-origin", cache: "no-store" });
      if (!response.ok && response.status !== 401) throw new Error();
      setLoggedIn(response.ok);
      if (response.ok) {
        const data = await response.json() as { seller: Seller | null; taxProfile: TaxProfile | null; books: Book[] };
        setSeller(data.seller);
        setTaxProfile(data.taxProfile);
        setBooks(data.books);
      }
    } catch { setMessage("No pudimos cargar el panel. Actualiza la página e inténtalo de nuevo."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!demoAvailable) void refresh(); else setLoading(false); }, [demoAvailable]);

  async function submit(event: FormEvent<HTMLFormElement>, path: string, success: string, method: "POST" | "PATCH" = "POST") {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const body: Record<string, unknown> = { ...values };
    if (path.endsWith("/profile")) body.acceptTerms = values.acceptTerms === "on";
    if (path.includes("/books")) { body.declareRights = values.declareRights === "on"; body.priceClp = Number(values.priceClp); }
    try { await post(path, body, method); setMessage(success); form.reset(); if (path === "/api/marketplace/seller/books") setPricePreview(""); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos guardar los datos."); }
  }

  async function upload(event: FormEvent<HTMLFormElement>, bookId: string, kind: "ebook_pdf" | "cover") {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch(`/api/marketplace/seller/books/${bookId}/assets`, { method: "POST", body: new FormData(event.currentTarget), credentials: "same-origin" });
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

  if (demoMode) return <SellerDemo onExit={() => { setDemoMode(false); setLoggedIn(false); setSeller(null); setTaxProfile(null); setBooks([]); }} />;

  return <main className="site-container" style={{ maxWidth: 800, paddingTop: 100, paddingBottom: 100 }}>
    <p className="eyebrow">Marketplace de ebooks</p>
    <h1>Espacio de autores</h1>
    <p>Publica ebooks sobre IA, tecnología y negocios. Tu perfil y cada libro pasan por revisión antes de aparecer en la tienda.</p>
    {message && <p role="status" style={{ padding: 16, border: "1px solid var(--border)" }}>{message}</p>}
    {loading ? <p>Cargando…</p> : !loggedIn && demoAvailable ? <section>
      <h2>Vista de demostración</h2>
      <p>Explora el panel de autor con datos de ejemplo. Esta vista no crea cuentas, libros ni pagos.</p>
      <button type="button" className="button button-dark" onClick={() => { setDemoMode(true); setLoggedIn(true); setSeller(demoSeller); setTaxProfile({ rut: "", legal_name: "", declared_vat_status: "vat_registered", review_status: "verified" }); setBooks(demoBooks); setMessage(""); }}>Entrar a la demo</button>
    </section> : !loggedIn ? <form onSubmit={(event) => { event.preventDefault(); setMessage(""); const form = event.currentTarget; const email = new FormData(form).get("email"); void post("/api/marketplace/seller/login", { email }).then(() => setMessage("Si el correo es válido, recibirás un enlace de acceso. Revisa también la carpeta de spam.")).catch(() => setMessage("No pudimos enviar el enlace. Inténtalo más tarde.")); }}>
      <label htmlFor="seller-email">Tu correo electrónico</label>
      <input id="seller-email" name="email" type="email" autoComplete="email" required style={inputStyle} />
      <button type="submit" className="button button-dark">Recibir enlace de acceso</button>
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
    </section> : <>
      {demoMode && <p role="status">Estás viendo datos de ejemplo. <a href="/ebooks/vender/simulador">Prueba el simulador de ingresos</a>. La publicación y los cobros no están activos en esta demo.</p>}
      <p><strong>{seller.display_name}</strong> · Estado: {seller.status === "active" ? "Verificado" : seller.status === "rejected" ? "Rechazado" : "En verificación"}</p>
      <p>Revisión tributaria: {taxProfile?.review_status === "verified" ? "Verificada" : taxProfile?.review_status === "rejected" ? "Rechazada: corrige tus datos para volver a solicitar revisión" : "Pendiente"}</p>
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
      <h2>Mis ebooks</h2>
      {books.length ? <ul>{books.map((book) => <li key={book.id} style={{ marginBottom: 28 }}>
        <strong>{book.title ?? book.slug}</strong> · {book.status} · ${Number(book.price_minor).toLocaleString("es-CL")} CLP
        {book.status === "changes_requested" && <form onSubmit={(event) => void submit(event, `/api/marketplace/seller/books/${book.id}`, "Nueva revisión guardada. Sube el PDF y la portada corregidos.", "PATCH")}>
          <p>El equipo pidió cambios. Guarda una nueva revisión antes de volver a enviar el libro.</p>
          <label>Título <input name="title" defaultValue={book.title} required minLength={3} maxLength={180} style={inputStyle} /></label>
          <label>Descripción <textarea name="description" defaultValue={book.description} required minLength={20} maxLength={10000} rows={6} style={inputStyle} /></label>
          <label>Categoría <select name="category" defaultValue={book.category} style={inputStyle}><option value="ia">IA</option><option value="tecnologia">Tecnología</option><option value="negocios">Negocios</option></select></label>
          <label>Precio en CLP <input name="priceClp" type="number" value={revisionPrices[book.id] ?? String(book.price_minor)} onChange={(event) => setRevisionPrices((prices) => ({ ...prices, [book.id]: event.target.value }))} min={500} max={10000000} step={1} required style={inputStyle} /></label>
          <PayoutCalculator priceValue={revisionPrices[book.id] ?? String(book.price_minor)} />
          <label><input name="declareRights" type="checkbox" required /> Confirmo que tengo los derechos de la versión corregida.</label>
          <p><button type="submit">Guardar nueva revisión</button></p>
        </form>}
        {book.status === "draft" && <div>
          <form onSubmit={(event) => void upload(event, book.id, "ebook_pdf")}><input type="hidden" name="kind" value="ebook_pdf" /><label>PDF privado (hasta 4 MiB) <input name="file" type="file" accept="application/pdf" required /></label> <button type="submit">{book.has_pdf ? "Reemplazar PDF" : "Subir PDF"}</button></form>
          <form onSubmit={(event) => void upload(event, book.id, "cover")}><input type="hidden" name="kind" value="cover" /><label>Portada JPG o PNG (hasta 4 MiB) <input name="file" type="file" accept="image/jpeg,image/png" required /></label> <button type="submit">{book.has_cover ? "Reemplazar portada" : "Subir portada"}</button></form>
          <button type="button" disabled={!book.has_pdf || !book.has_cover} onClick={() => void sendForReview(book.id)}>Enviar a revisión</button>
        </div>}
      </li>)}</ul> : <p>Aún no tienes borradores.</p>}
      {!demoMode && <><h2>Crear borrador</h2>
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
      </form></>}
      {demoMode ? <button type="button" onClick={() => { setDemoMode(false); setLoggedIn(false); setSeller(null); setTaxProfile(null); setBooks([]); }}>Salir de la demo</button>
        : <button type="button" onClick={() => { void post("/api/marketplace/seller/logout", {}).then(() => window.location.reload()); }}>Salir</button>}
    </>}
  </main>;
}
