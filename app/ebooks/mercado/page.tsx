import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InviteAuthor from "@/components/marketplace/InviteAuthor";
import { listPublishedMarketplaceBooks, listPublishedMarketplaceCategories } from "@/lib/marketplace-review";
import { createPageMetadata, SITE_URL } from "@/lib/seo";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";
import { getLiveCatalogEntries } from "@/lib/ebook-catalog";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { computeEbookTotal } from "@/lib/ebook-promotion";
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
function crececoniaCategory(resource: string): keyof typeof categoryLabel {
  if (resource.includes("webs")) return "tecnologia";
  if (resource.includes("agentes")) return "negocios";
  return "ia";
}
const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceCatalogPage({ searchParams }: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[]; category?: string | string[] }>;
}) {
  const preview = marketplaceDemoAvailable();
  if (!marketplacePublicAvailable()) return <><Navbar /><main className="md-shop"><section className="md-hero"><div className="md-wrap"><div className="md-kicker">CRECECONIA / MARKETPLACE</div><h1>Pronto, nuevas<br /><em>voces para aprender.</em></h1><p>Estamos preparando una biblioteca de ebooks de autores independientes sobre IA, tecnología y negocios. Cada libro pasará por revisión antes de publicarse.</p><Link className="md-button" href="/ebooks">Explorar ebooks de CrececonIA ↗</Link></div></section></main><Footer /></>;
  const filters = await searchParams;
  const rawPage = filters.page;
  const requestedPage = typeof rawPage === "string" && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage <= Math.floor(Number.MAX_SAFE_INTEGER / 24) ? requestedPage : 1;
  const query = typeof filters.q === "string" ? filters.q.trim().slice(0, 100) : "";
  const pricingTime = Date.now();
  const ownEntries = getLiveCatalogEntries(pricingTime);
  const publishedCategories = await listPublishedMarketplaceCategories().catch((error) => {
    if (!preview) throw error;
    return [];
  });
  const available = new Set([...ownEntries.map(({ resource }) => crececoniaCategory(resource)), ...publishedCategories]);
  const categories = (Object.keys(categoryLabel) as Array<keyof typeof categoryLabel>).filter((key) => available.has(key));
  const category = categories.find((key) => key === filters.category);
  const results = await listPublishedMarketplaceBooks(page, { query, category }).catch((error) => {
    if (!preview) throw error;
    return [];
  });
  const hasNext = results.length > 24;
  const books = results.slice(0, 24);
  const crececoniaBooks = page === 1 ? await Promise.all(ownEntries
    .filter((entry) => (!category || crececoniaCategory(entry.resource) === category)
      && (!query || `${entry.title} ${entry.subject} CrececonIA ${entry.storeProfile.outcome}`.toLocaleLowerCase("es-CL").includes(query.toLocaleLowerCase("es-CL"))))
    .map(async (entry) => {
      const current = await getCurrentPrice(entry.resource).catch(() => ({ price: entry.tierPrices.regular }));
      return {
        entry,
        category: crececoniaCategory(entry.resource),
        price: computeEbookTotal([{ resource: entry.resource, price: current.price }], pricingTime).total,
      };
    })) : [];
  const pageHref = (nextPage: number, nextCategory = category ?? "") => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextCategory) params.set("category", nextCategory);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/ebooks/mercado${params.size ? `?${params.toString()}` : ""}`;
  };
  const bookHref = (path: string) => preview ? new URL(path, SITE_URL).href : path;
  return <>
    <Navbar />
    <main className="md-shop mr-shop">
      <section className="md-hero mr-hero"><div className="md-wrap">
        <p className="md-kicker">CRECECONIA / MARKETPLACE</p>
        <h1>Ideas para leer.<br /><em>Herramientas para hacer.</em></h1>
        <p>Libros digitales de CrececonIA y autores independientes sobre inteligencia artificial, tecnología y negocios. Cada título de otro autor pasa por revisión antes de publicarse.</p>
        <nav className="mr-links" aria-label="Ebooks"><Link href="/ebooks">Rutas de ebooks CrececonIA</Link><Link href="/ebooks/vender">Publicar mi ebook ↗</Link></nav>
        <InviteAuthor />
      </div></section>
      <section className="md-wrap md-catalog" aria-labelledby="marketplace-results-title">
        <div className="md-section-head"><div><p className="md-kicker">CRECECONIA Y AUTORES</p><h2 id="marketplace-results-title">Encuentra tu<br /><em>próximo paso.</em></h2></div><p>Busca un tema o filtra por categoría. Cada ficha indica lo que aprenderás antes de elegir.</p></div>
        {categories.length > 0 && <nav className="mr-categories" aria-label="Categorías de ebooks">
          <Link href={pageHref(1, "")} aria-current={!category ? "true" : undefined}>Todas las categorías</Link>
          {categories.map((key) => <Link href={pageHref(1, key)} aria-current={category === key ? "true" : undefined} key={key}>{categoryLabel[key]}</Link>)}
        </nav>}
        <form className="mr-filters" action="/ebooks/mercado" method="get" role="search">
          <label htmlFor="marketplace-search">Buscar por libro, autor o tema<input id="marketplace-search" type="search" name="q" maxLength={100} defaultValue={query} placeholder="Ej.: agentes de IA" /></label>
          {category && <input type="hidden" name="category" value={category} />}
          <button type="submit">Buscar libros ↗</button>
          {(query || category) && <Link href="/ebooks/mercado">Limpiar filtros</Link>}
        </form>
        <p className="mr-count" aria-live="polite">{books.length + crececoniaBooks.length} {books.length + crececoniaBooks.length === 1 ? "libro" : "libros"} en esta página{query ? ` para “${query}”` : ""}</p>
        {books.length + crececoniaBooks.length === 0 ? <p className="md-empty">{page > 1 ? "No hay más libros en esta página." : "Aún no hay libros que coincidan con estos filtros."}</p> : <div className="md-grid">
          {crececoniaBooks.map(({ entry, category: bookCategory, price }) => <article className="md-card" key={entry.resource}>
            <Link className="md-card-cover-link" href={bookHref(entry.href)} aria-label={`Ver ${entry.title}`}><img className="mr-cover-image" src={entry.coverSrc} alt={`Portada de ${entry.title}`} loading="lazy" /></Link>
            <div className="md-card-info"><span className="md-card-meta">{categoryLabel[bookCategory]} · CrececonIA</span><h3>{entry.title}</h3><p>Por CrececonIA</p><div className="md-card-bottom"><strong>{formatCLP(String(price))}</strong><Link className="md-card-action" href={bookHref(entry.href)}>Ver libro ↗</Link></div></div>
          </article>)}
          {books.map((book) => <article className="md-card" key={book.id}>
            <Link className="md-card-cover-link" href={bookHref(`/ebooks/mercado/${book.slug}`)} aria-label={`Ver ${book.title}`}>
              {book.has_cover ? <img className="mr-cover-image" src={`/api/marketplace/covers/${book.id}`} alt={`Portada de ${book.title}`} loading="lazy" />
                : <div className={`md-cover md-cover-${coverTone[book.category]}`} aria-hidden="true"><span>CRECECONIA / AUTORES</span><strong>{book.title}</strong><small>{book.author_display_name.toUpperCase()}</small></div>}
            </Link>
            <div className="md-card-info"><span className="md-card-meta">{categoryLabel[book.category]}</span><h3>{book.title}</h3><p>Por {book.author_display_name}</p><div className="md-card-bottom"><strong>{formatCLP(book.price_minor)}</strong><Link className="md-card-action" href={bookHref(`/ebooks/mercado/${book.slug}`)}>Ver libro ↗</Link></div></div>
          </article>)}
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
