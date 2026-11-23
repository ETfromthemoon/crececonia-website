import EbookCard from "@/components/EbookCard";
import EbookCatalogBrowser from "@/components/marketplace/EbookCatalogBrowser";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ResourceNav from "@/components/ResourceNav";
import { EBOOK_CATALOG, isCatalogEntryLive } from "@/lib/ebook-catalog";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { EBOOK_BUNDLES } from "@/lib/ebook-bundles";
import { computeEbookTotal, isEbookFlashActive } from "@/lib/ebook-promotion";
import EbookFlashBanner from "@/components/EbookFlashBanner";
import { createPageMetadata } from "@/lib/seo";
import { marketplaceDemoAvailable, marketplacePublicAvailable } from "@/lib/marketplace-demo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Ebooks de IA aplicada — CrececonIA",
  description: "Elige una ruta práctica para dominar Claude, crear agentes de IA o construir sitios web con IA. Descarga inmediata en PDF móvil y A4.",
  path: "/ebooks",
});

export default async function EbooksPage() {
  const demoAvailable = marketplaceDemoAvailable();
  const marketplaceAvailable = marketplacePublicAvailable();
  const pricingTime = Date.now();
  const bookCards = await Promise.all(EBOOK_CATALOG.map(async (entry) => {
    const live = entry.active && isCatalogEntryLive(entry);
    let priceLabel: string | undefined;
    let previousPriceLabel: string | undefined;
    if (live) {
      const priceInfo = await getCurrentPrice(entry.resource).catch(() => ({ price: entry.active ? entry.tierPrices.regular : 0 }));
      const quote = computeEbookTotal([{ resource: entry.resource, price: priceInfo.price }], pricingTime);
      priceLabel = `$${quote.total.toLocaleString("es-CL")} CLP`;
      if (isEbookFlashActive(pricingTime)) previousPriceLabel = `$${quote.subtotal.toLocaleString("es-CL")} CLP`;
    }
    return {
      key: entry.resource,
      title: entry.title,
      description: entry.subject,
      href: entry.href,
      coverSrc: entry.coverSrc,
      status: (live ? "available" : "coming-soon") as "available" | "coming-soon",
      priceLabel,
      previousPriceLabel,
      level: entry.storeProfile.level,
      outcome: entry.storeProfile.outcome,
      audience: entry.storeProfile.audience,
      pageCount: entry.storeProfile.pageCount,
    };
  }));

  const liveResources = new Set(EBOOK_CATALOG.filter((entry) => entry.active && isCatalogEntryLive(entry)).map((entry) => entry.resource));
  const visibleBundles = EBOOK_BUNDLES.filter((bundle) => bundle.resources.every((resource) => liveResources.has(resource)));
  const bundleCards = await Promise.all(visibleBundles.map(async (bundle) => {
    const prices = await Promise.all(bundle.resources.map(async (resource) => {
      const entry = EBOOK_CATALOG.find((item) => item.resource === resource);
      return getCurrentPrice(resource).catch(() => ({ price: entry?.active ? entry.tierPrices.regular : 0 }));
    }));
    const totals = computeEbookTotal(bundle.resources.map((resource, index) => ({ resource, price: prices[index].price })), pricingTime);
    const anchorHref = EBOOK_CATALOG.find((entry) => entry.resource === bundle.resources[0])!.href;
    return {
      key: bundle.slug,
      title: bundle.title,
      description: bundle.pitch,
      href: `${anchorHref}?bundle=${bundle.slug}#comprar`,
      coverSrcs: bundle.resources.map((resource) => EBOOK_CATALOG.find((entry) => entry.resource === resource)?.coverSrc).filter((src): src is string => Boolean(src)),
      status: "available" as const,
      priceLabel: `$${totals.total.toLocaleString("es-CL")} CLP · ${totals.discountPercent}% off`,
      previousPriceLabel: isEbookFlashActive(pricingTime) ? `$${totals.subtotal.toLocaleString("es-CL")} CLP` : undefined,
      itemCount: bundle.resources.length,
    };
  }));

  return (
    <><Navbar />
    <main className="ebook-store">
      <ResourceNav />
      <EbookFlashBanner active={isEbookFlashActive(pricingTime)} />
      <section className="ebook-store-hero">
        <div className="ebook-store-shell ebook-store-hero-grid">
          <div>
            <span className="ebook-store-kicker">Ebooks de CrececonIA · {bookCards.length} títulos</span>
            <h1>Aprende algo.<br /><em>Aplícalo esta semana.</em></h1>
          </div>
          <div className="ebook-store-hero-aside">
            <p>Rutas prácticas para aprender Claude, operar un negocio o construir sitios corporativos, eCommerce y productos SaaS con IA. Compra solo la que coincide con tu punto de partida.</p>
            <a href="#catalogo">Elegir mi ebook <span>↓</span></a>
          </div>
        </div>
        <div className="ebook-store-signal" aria-label="Beneficios de compra">
          <div className="ebook-store-shell"><span>PDF móvil + A4</span><span>Descarga inmediata</span><span>Pago seguro con Flow</span><span>Acceso recuperable</span></div>
        </div>
      </section>

      <section id="catalogo" className="ebook-store-catalog">
        <div className="ebook-store-shell">
          <div className="ebook-store-heading">
            <div><span>01 / Biblioteca</span><h2>Encuentra tu próximo paso.</h2></div>
            <p>Cada libro funciona solo. Lee para quién es y para quién no antes de elegir; si buscas una progresión completa, revisa las rutas más abajo.</p>
          </div>
          <EbookCatalogBrowser books={bookCards} />
        </div>
      </section>

      {marketplaceAvailable && <section id="vender" className="ebook-marketplace-seller">
        <div className="ebook-store-shell ebook-marketplace-seller-inner">
          <div>
            <span>Marketplace · Autores independientes</span>
            <h2>Conocimiento que encuentra a su próxima persona.</h2>
          </div>
          <div>
            <p>Explora libros de IA, tecnología y negocios de autores invitados. Si tienes un ebook propio, conoce el espacio para publicarlo, revisar tus ventas y calcular tus ingresos.</p>
            <div className="ebook-marketplace-actions">
              <a href="/ebooks/mercado">Explorar marketplace <span aria-hidden="true">→</span></a>
              <a href="/ebooks/vender">{demoAvailable ? "Probar espacio de autores" : "Vender mi ebook"} <span aria-hidden="true">→</span></a>
            </div>
            <p className="ebook-marketplace-seller-note">{demoAvailable ? "Demo interactiva con datos de ejemplo · Sin cobros reales" : "Publicaciones sujetas a revisión y aprobación"}</p>
          </div>
        </div>
      </section>}

      <section id="elegir" className="ebook-store-decision">
        <div className="ebook-store-shell ebook-store-decision-grid">
          <div><span>Antes de elegir</span><h2>Aprende a tu ritmo.</h2></div>
          <div><strong>Elige un ebook si</strong><p>quieres aprender y ejecutar con una ruta práctica, sin sesiones ni soporte 1:1.</p></div>
          <div><strong>¿Necesitas apoyo?</strong><p>Si buscas adaptar una solución a tu caso o delegarla, revisa <a href="/mentoria">mentoría</a> o <a href="/implementacion">implementación</a>.</p></div>
        </div>
      </section>

      {bundleCards.length > 0 && (
        <section className="ebook-store-routes">
          <div className="ebook-store-shell">
            <div className="ebook-store-heading ebook-store-heading-light">
              <div><span>02 / Rutas</span><h2>Combina libros con una progresión lógica.</h2></div>
              <p>El descuento se calcula sobre el precio vigente. Un solo pago, todos los enlaces de descarga.</p>
            </div>
            <div className="ebook-route-grid">{bundleCards.map(({ key, ...card }, index) => <EbookCard key={key} index={index} variant="route" {...card} />)}</div>
          </div>
        </section>
      )}

      <section className="ebook-store-help">
        <div className="ebook-store-shell ebook-store-help-grid">
          <div><span>¿Ya compraste?</span><h2>Tu biblioteca sigue disponible.</h2></div>
          <div><p>Recupera tus libros con el mismo email de compra. No necesitas buscar el correo original.</p><a href="/ebook/descargar">Recuperar descargas <span>→</span></a></div>
        </div>
      </section>
    </main>
    <Footer /></>
  );
}
