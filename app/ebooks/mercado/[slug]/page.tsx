import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMarketplaceRecommendations, getPublishedMarketplaceBook } from "@/lib/marketplace-review";
import MarketplaceSandboxCheckout from "./sandbox-checkout";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";
import { getDemoBook } from "@/lib/marketplace/demo-catalog";
import DemoBookDetail from "./DemoBookDetail";
import "../demo.css";

export const dynamic = "force-dynamic";

const categoryLabel = { ia: "Inteligencia artificial", tecnologia: "Tecnología", negocios: "Negocios" };
const formatCLP = (value: string) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(BigInt(value));

export default async function MarketplaceBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (marketplaceDemoAvailable()) {
    const demoBook = getDemoBook(slug);
    if (!demoBook) notFound();
    return <><Navbar /><DemoBookDetail book={demoBook} /><Footer /></>;
  }
  if (!marketplacePublicAvailable()) notFound();
  const book = await getPublishedMarketplaceBook(slug);
  if (!book) notFound();
  let recommendations: Awaited<ReturnType<typeof getMarketplaceRecommendations>> = [];
  try {
    recommendations = await getMarketplaceRecommendations(book);
  } catch (error) {
    console.error("marketplace_recommendations_unavailable", error instanceof Error ? error.message : "unknown");
  }
  const sandboxCheckout = process.env.MARKETPLACE_FLOW_SANDBOX_ENABLED === "true"
    && process.env.FLOW_SANDBOX === "true"
    && (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development");
  return <>
    <Navbar />
    <main style={{ minHeight: "70vh", maxWidth: 900, margin: "0 auto", padding: "120px 24px 80px" }}>
      <Link href="/ebooks/mercado">← Todos los autores</Link>
      <p className="eyebrow" style={{ marginTop: 40 }}>{categoryLabel[book.category]}</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1.05, margin: "18px 0" }}>{book.title}</h1>
      {book.subtitle && <p style={{ fontSize: "1.4rem", color: "var(--muted)" }}>{book.subtitle}</p>}
      <p>Por {book.author_display_name} · {book.seller_name}</p>
      <p style={{ fontSize: "2rem", color: "var(--champagne)", margin: "32px 0" }}>{formatCLP(book.price_minor)}</p>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 40 }}>{book.description}</div>
      {sandboxCheckout ? <MarketplaceSandboxCheckout bookId={book.id} priceMinor={book.price_minor} />
        : <p role="status">La compra de este libro estará disponible próximamente.</p>}
      {recommendations.length > 0 && <section aria-labelledby="related-books" style={{ marginTop: 64 }}>
        <p className="eyebrow">También te puede interesar</p>
        <h2 id="related-books" style={{ fontSize: "2rem", margin: "12px 0 24px" }}>Sigue explorando</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {recommendations.map((recommended) => <article key={recommended.id} style={{ border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
            <p className="eyebrow">{categoryLabel[recommended.category]}</p>
            <h3 style={{ fontSize: "1.3rem", margin: "12px 0" }}><Link href={`/ebooks/mercado/${recommended.slug}`}>{recommended.title}</Link></h3>
            <p>Por {recommended.author_display_name}</p>
            <p style={{ color: "var(--champagne)" }}>{formatCLP(recommended.price_minor)}</p>
          </article>)}
        </div>
      </section>}
    </main>
    <Footer />
  </>;
}
