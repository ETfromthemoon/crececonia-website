import EbookCard from "@/components/EbookCard";
import { EBOOK_CATALOG, isCatalogEntryLive } from "@/lib/ebook-catalog";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { EBOOK_BUNDLES, computeBundleTotal } from "@/lib/ebook-bundles";
import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Ebooks de IA aplicada — CrececonIA",
  description: "Elige una ruta práctica para dominar Claude, crear agentes de IA o construir sitios web con IA. Descarga inmediata en PDF móvil y A4.",
  path: "/ebooks",
});

export default async function EbooksPage() {
  const bookCards = await Promise.all(EBOOK_CATALOG.map(async (entry) => {
    const live = entry.active && isCatalogEntryLive(entry);
    const priceLabel = live
      ? `$${(await getCurrentPrice(entry.resource).catch(() => ({ price: entry.active ? entry.tierPrices.regular : 0 }))).price.toLocaleString("es-CL")} CLP`
      : undefined;
    return {
      key: entry.resource,
      title: entry.title,
      description: entry.subject,
      href: entry.href,
      coverSrc: entry.coverSrc,
      status: (live ? "available" : "coming-soon") as "available" | "coming-soon",
      priceLabel,
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
    const totals = computeBundleTotal(bundle.resources.map((resource, index) => ({ resource, price: prices[index].price })));
    const anchorHref = EBOOK_CATALOG.find((entry) => entry.resource === bundle.resources[0])!.href;
    return {
      key: bundle.slug,
      title: bundle.title,
      description: bundle.pitch,
      href: `${anchorHref}?bundle=${bundle.slug}#comprar`,
      coverSrcs: bundle.resources.map((resource) => EBOOK_CATALOG.find((entry) => entry.resource === resource)?.coverSrc).filter((src): src is string => Boolean(src)),
      status: "available" as const,
      priceLabel: `$${totals.total.toLocaleString("es-CL")} CLP · ${totals.discountPercent}% off`,
      itemCount: bundle.resources.length,
    };
  }));

  return (
    <main className="ebook-store">
      <section className="ebook-store-hero">
        <div className="ebook-store-shell ebook-store-hero-grid">
          <div>
            <span className="ebook-store-kicker">Biblioteca CrececonIA · 07 títulos</span>
            <h1>Elige el conocimiento que necesitas <em>aplicar esta semana.</em></h1>
          </div>
          <div className="ebook-store-hero-aside">
            <p>Rutas prácticas para aprender Claude, operar un negocio o construir sitios corporativos, eCommerce y productos SaaS con IA. Compra solo la que coincide con tu punto de partida.</p>
            <a href="#elegir">Elegir mi ebook <span>↓</span></a>
          </div>
        </div>
        <div className="ebook-store-signal" aria-label="Beneficios de compra">
          <div className="ebook-store-shell"><span>PDF móvil + A4</span><span>Descarga inmediata</span><span>Pago seguro con Flow</span><span>Acceso recuperable</span></div>
        </div>
      </section>

      <section id="elegir" className="ebook-store-decision">
        <div className="ebook-store-shell ebook-store-decision-grid">
          <div><span>Antes de elegir</span><h2>Esta ruta es para avanzar por tu cuenta.</h2></div>
          <div><strong>Elige un ebook si</strong><p>quieres aprender y ejecutar con una ruta práctica, sin depender de sesiones ni soporte 1:1.</p></div>
          <div><strong>No lo elijas si</strong><p>necesitas adaptar una solución a tu caso o que alguien la implemente. Revisa mentoría o implementación antes de comprar por impulso.</p></div>
        </div>
      </section>

      <section id="catalogo" className="ebook-store-catalog">
        <div className="ebook-store-shell">
          <div className="ebook-store-heading">
            <div><span>01 / Biblioteca</span><h2>Empieza por el resultado que necesitas.</h2></div>
            <p>Cada libro funciona solo. Lee para quién es y para quién no antes de elegir; si buscas una progresión completa, revisa las rutas más abajo.</p>
          </div>
          <div className="ebook-store-grid">{bookCards.map(({ key, ...card }, index) => <EbookCard key={key} index={index} {...card} />)}</div>
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
  );
}
