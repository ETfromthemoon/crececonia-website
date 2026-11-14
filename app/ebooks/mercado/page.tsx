import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { listPublishedMarketplaceBooks } from "@/lib/marketplace-review";
import { createPageMetadata } from "@/lib/seo";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";
import DemoCatalog from "./DemoCatalog";
import "./demo.css";
import "./real.css";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "Marketplace de ebooks | CrececonIA",
  description: "Libros digitales de IA, tecnología y negocios escritos por especialistas y revisados antes de publicarse.",
  path: "/ebooks/mercado",
});

const categoryLabel = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const coverTone = { ia: "violet", tecnologia: "blue", negocios: "lime" };
const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceCatalogPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; category?: string | string[] }>;
}) {
  if (marketplaceDemoAvailable()) return <><Navbar /><DemoCatalog /><Footer /></>;
  if (!marketplacePublicAvailable()) return <><Navbar /><main className="md-shop"><section className="md-hero"><div className="md-wrap"><div className="md-kicker">CRECECONIA / MARKETPLACE</div><h1>Pronto, nuevas<br /><em>voces para aprender.</em></h1><p>Estamos preparando una biblioteca de ebooks de autores independientes sobre IA, tecnología y negocios. Cada libro pasará por revisión antes de publicarse.</p><Link className="md-button" href="/ebooks">Explorar ebooks de CrececonIA ↗</Link></div></section></main><Footer /></>;
  const filters = await searchParams;
  const rawPage = filters.page;
  const requestedPage = typeof rawPage === "string" && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage <= Math.floor(Number.MAX_SAFE_INTEGER / 24) ? requestedPage : 1;
  const query = typeof filters.q === "string" ? filters.q.trim().slice(0, 100) : "";
  const category = typeof filters.category === "string" && ["ia", "tecnologia", "negocios"].includes(filters.category)
    ? filters.category as keyof typeof categoryLabel : undefined;
  const results = await listPublishedMarketplaceBooks(page, { query, category });
  const hasNext = results.length > 24;
  const books = results.slice(0, 24);
  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/ebooks/mercado${params.size ? `?${params.toString()}` : ""}`;
  };
  return <>
    <Navbar />
    <main className="md-shop mr-shop">
      <section className="md-hero mr-hero"><div className="md-wrap">
        <p className="md-kicker">CRECECONIA / MARKETPLACE</p>
        <h1>Ideas para leer.<br /><em>Herramientas para hacer.</em></h1>
        <p>Libros digitales de autores independientes sobre inteligencia artificial, tecnología y negocios. Cada título pasa por revisión antes de publicarse.</p>
        <nav className="mr-links" aria-label="Ebooks"><Link href="/ebooks">Ebooks de CrececonIA</Link><Link href="/ebooks/vender">Publicar mi ebook ↗</Link></nav>
      </div></section>
      <section className="md-wrap md-catalog" aria-labelledby="marketplace-results-title">
        <div className="md-section-head"><div><p className="md-kicker">BIBLIOTECA DE AUTORES</p><h2 id="marketplace-results-title">Encuentra tu<br /><em>próximo paso.</em></h2></div><p>Busca un tema o filtra por categoría. Cada ficha indica lo que aprenderás antes de elegir.</p></div>
        <form className="mr-filters" action="/ebooks/mercado" method="get" role="search">
          <label htmlFor="marketplace-search">Buscar por libro, autor o tema<input id="marketplace-search" type="search" name="q" maxLength={100} defaultValue={query} placeholder="Ej.: agentes de IA" /></label>
          <label htmlFor="marketplace-category">Categoría<select id="marketplace-category" name="category" defaultValue={category ?? ""}><option value="">Todas las categorías</option><option value="ia">Inteligencia artificial</option><option value="tecnologia">Tecnología</option><option value="negocios">Negocios</option></select></label>
          <button type="submit">Buscar libros ↗</button>
          {(query || category) && <Link href="/ebooks/mercado">Limpiar filtros</Link>}
        </form>
        <p className="mr-count" aria-live="polite">{books.length} {books.length === 1 ? "libro" : "libros"} en esta página{query ? ` para “${query}”` : ""}</p>
        {books.length === 0 ? <p className="md-empty">{page > 1 ? "No hay más libros en esta página." : "Aún no hay libros que coincidan con estos filtros."}</p> : <div className="md-grid">
          {books.map((book) => <Link className="md-card" href={`/ebooks/mercado/${book.slug}`} key={book.id}>
            {book.has_cover ? <img className="mr-cover-image" src={`/api/marketplace/covers/${book.id}`} alt={`Portada de ${book.title}`} loading="lazy" />
              : <div className={`md-cover md-cover-${coverTone[book.category]}`} aria-hidden="true"><span>CRECECONIA / AUTORES</span><strong>{book.title}</strong><small>{book.author_display_name.toUpperCase()}</small></div>}
            <div className="md-card-info"><span className="md-card-meta">{categoryLabel[book.category]}</span><h3>{book.title}</h3><p>Por {book.author_display_name}</p><div className="md-card-bottom"><strong>{formatCLP(book.price_minor)}</strong><span>Ver libro ↗</span></div></div>
          </Link>)}
        </div>}
        {(page > 1 || hasNext) && <nav className="mr-pagination" aria-label="Páginas del marketplace">
          {page > 1 && <Link href={pageHref(page - 1)}>← Anterior</Link>}
        <span>Página {page}</span>
          {hasNext && <Link href={pageHref(page + 1)}>Siguiente →</Link>}
        </nav>}
      </section>
    </main>
    <Footer />
  </>;
}
