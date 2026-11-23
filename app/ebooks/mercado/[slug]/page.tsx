import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMarketplaceRecommendations, getPublishedMarketplaceBook } from "@/lib/marketplace-review";
import MarketplaceCheckout from "./MarketplaceCheckout";
import { marketplaceCheckoutMode } from "@/lib/marketplace-checkout";
import { marketplacePublicAvailable } from "@/lib/marketplace-demo";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import "../demo.css";
import "../real.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!marketplacePublicAvailable()) return { title: "Libro no disponible", robots: { index: false } };
  const book = await getPublishedMarketplaceBook(slug);
  if (!book) return { title: "Libro no disponible", robots: { index: false } };
  return createPageMetadata({
    title: `${book.title} — Marketplace CrececonIA`,
    description: book.subtitle || book.description.slice(0, 160),
    path: `/ebooks/mercado/${slug}`,
  });
}

const categoryLabel = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const coverTone = { ia: "violet", tecnologia: "blue", negocios: "lime" };
const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!marketplacePublicAvailable()) notFound();
  const book = await getPublishedMarketplaceBook(slug);
  if (!book) notFound();
  let recommendations: Awaited<ReturnType<typeof getMarketplaceRecommendations>> = [];
  try {
    recommendations = await getMarketplaceRecommendations(book);
  } catch (error) {
    console.error("marketplace_recommendations_unavailable", error instanceof Error ? error.message : "unknown");
  }
  const checkoutMode = marketplaceCheckoutMode();
  return <>
    <Navbar />
    <main className="md-shop"><div className="md-wrap md-detail mr-detail">
      <Link className="md-back" href="/ebooks/mercado">← Volver al marketplace</Link>
      <div className="md-detail-hero">
        {book.has_cover ? <img className="mr-detail-cover" src={`/api/marketplace/covers/${book.id}`} alt={`Portada de ${book.title}`} />
          : <div className={`md-cover md-cover-${coverTone[book.category]}`} aria-hidden="true"><span>CRECECONIA / AUTORES</span><strong>{book.title}</strong><small>{book.author_display_name.toUpperCase()}</small></div>}
        <div className="md-detail-main">
          <p className="md-kicker">{categoryLabel[book.category]} / Ebook digital</p>
          <h1>{book.title}</h1>
          {book.subtitle && <p className="md-detail-subtitle">{book.subtitle}</p>}
          <p className="md-detail-author">Por <strong>{book.author_display_name}</strong> · {book.seller_name}</p>
          <p className="md-detail-description mr-description">{book.description}</p>
          <div className="md-detail-purchase"><div><span>PRECIO FINAL</span><strong>{formatCLP(book.price_minor)}</strong></div>
            {checkoutMode && <MarketplaceCheckout bookId={book.id} priceMinor={book.price_minor} mode={checkoutMode} />}
          </div>
          {!checkoutMode && <p className="md-detail-disclaimer">Este título todavía no admite pagos en línea.</p>}
        </div>
      </div>
      {recommendations.length > 0 && <section className="mr-related" aria-labelledby="related-books">
        <p className="md-kicker">LECTURAS QUE SE CONECTAN</p>
        <h2 id="related-books">También te puede interesar.</h2>
        <div className="mr-related-grid">{recommendations.map((recommended) =>
          <Link className="mr-related-card" key={recommended.id} href={`/ebooks/mercado/${recommended.slug}`}>
            <span>{categoryLabel[recommended.category]}</span><h3>{recommended.title}</h3>
            <p>Por {recommended.author_display_name}</p><strong>{formatCLP(recommended.price_minor)} ↗</strong>
          </Link>)}</div>
      </section>}
    </div>
    </main>
    <Footer />
  </>;
}
