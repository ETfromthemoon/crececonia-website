import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listPublishedMarketplaceBooks } from "@/lib/marketplace-review";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Marketplace de ebooks | CrececonIA",
  description: "Libros digitales de IA, tecnología y negocios escritos por especialistas y revisados antes de publicarse.",
  path: "/ebooks/mercado",
});

const categoryLabel = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceCatalogPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const rawPage = (await searchParams).page;
  const requestedPage = typeof rawPage === "string" && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage <= Math.floor(Number.MAX_SAFE_INTEGER / 24) ? requestedPage : 1;
  const results = await listPublishedMarketplaceBooks(page);
  const hasNext = results.length > 24;
  const books = results.slice(0, 24);
  return <>
    <Navbar />
    <main style={{ minHeight: "70vh", maxWidth: 1120, margin: "0 auto", padding: "120px 24px 80px" }}>
      <p className="eyebrow">Ebooks · Autores invitados</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: 1.05, margin: "18px 0" }}>Ideas que se convierten en acción.</h1>
      <p style={{ maxWidth: 700, color: "var(--muted)", fontSize: "1.15rem" }}>
        Explora libros de autores independientes sobre inteligencia artificial, tecnología y negocios.
        Cada título pasa por revisión editorial antes de aparecer aquí.
      </p>
      <nav aria-label="Ebooks" style={{ display: "flex", gap: 20, margin: "30px 0 44px" }}>
        <Link href="/ebooks">Todos los ebooks</Link>
        <Link href="/ebooks/vender">Publica tu ebook</Link>
      </nav>
      {books.length === 0 ? <p>{page > 1 ? "No hay más libros en esta página." : "Aún no hay libros de autores invitados publicados."}</p> : <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20,
      }}>
        {books.map((book) => <article key={book.id} style={{ padding: 26, border: "1px solid var(--border)", borderRadius: 18 }}>
          <p className="eyebrow">{categoryLabel[book.category]}</p>
          <h2 style={{ fontSize: "1.65rem", margin: "18px 0 8px" }}>
            <Link href={`/ebooks/mercado/${book.slug}`}>{book.title}</Link>
          </h2>
          <p style={{ color: "var(--muted)" }}>Por {book.author_display_name}</p>
          <p style={{ margin: "20px 0" }}>{book.description.length > 180
            ? `${book.description.slice(0, 177).trimEnd()}…` : book.description}</p>
          <p style={{ color: "var(--champagne)" }}>{formatCLP(book.price_minor)}</p>
          <Link href={`/ebooks/mercado/${book.slug}`} aria-label={`Ver ${book.title}`}>Ver libro →</Link>
        </article>)}
      </div>}
      {(page > 1 || hasNext) && <nav aria-label="Páginas del marketplace" style={{ display: "flex", gap: 24, marginTop: 36 }}>
        {page > 1 && <Link href={page === 2 ? "/ebooks/mercado" : `/ebooks/mercado?page=${page - 1}`}>← Anterior</Link>}
        <span>Página {page}</span>
        {hasNext && <Link href={`/ebooks/mercado?page=${page + 1}`}>Siguiente →</Link>}
      </nav>}
    </main>
    <Footer />
  </>;
}
