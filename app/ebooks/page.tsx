import type { Metadata } from "next";
import EbookCard from "@/components/EbookCard";
import EbookSectionHeading from "@/components/EbookSectionHeading";
import { EBOOK_CATALOG, isCatalogEntryLive } from "@/lib/ebook-catalog";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { EBOOK_BUNDLES, computeBundleTotal } from "@/lib/ebook-bundles";

const SITE_URL = "https://www.crececonia.cl";

// El catálogo mezcla libros que ya están a la venta con libros que activan
// solos a una hora fijada (visibleFrom) — no se puede prerenderizar en build
// time o la transición automática nunca se reflejaría acá.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ebooks — CrececonIA",
  description:
    "Guías prácticas para dominar IA aplicada: Claude, agentes de IA, y sitios web con IA. Sin teoría — prompts, workflows y templates probados en producción.",
  alternates: { canonical: `${SITE_URL}/ebooks` },
};

export default async function EbooksPage() {
  const bookCards = await Promise.all(
    EBOOK_CATALOG.map(async (entry) => {
      if (!entry.active) {
        return {
          key: entry.resource,
          title: entry.title,
          description: entry.subject,
          href: entry.href,
          coverSrc: undefined as string | undefined,
          status: "coming-soon" as const,
          priceLabel: undefined as string | undefined,
        };
      }

      const live = isCatalogEntryLive(entry);
      const priceLabel = live
        ? `$${(
            await getCurrentPrice(entry.resource).catch(() => ({
              price: entry.tierPrices.regular,
            }))
          ).price.toLocaleString("es-CL")} CLP`
        : undefined;

      return {
        key: entry.resource,
        title: entry.title,
        description: entry.subject,
        href: entry.href,
        coverSrc: entry.coverSrc,
        status: (live ? "available" : "coming-soon") as "available" | "coming-soon",
        priceLabel,
      };
    })
  );

  // Un bundle solo se muestra si TODOS sus libros ya están vivos — mostrar un
  // bundle que incluye un libro que aún no llegó a su visibleFrom filtraría
  // su precio antes de la hora de lanzamiento acordada.
  const liveResources = new Set(
    EBOOK_CATALOG.filter((e) => e.active && isCatalogEntryLive(e)).map((e) => e.resource)
  );
  const visibleBundles = EBOOK_BUNDLES.filter((bundle) =>
    bundle.resources.every((r) => liveResources.has(r))
  );

  const bundleCards = await Promise.all(
    visibleBundles.map(async (bundle) => {
      const prices = await Promise.all(
        bundle.resources.map(async (resource) => {
          const entry = EBOOK_CATALOG.find((item) => item.resource === resource);
          return getCurrentPrice(resource).catch(() => ({
            price: entry?.active ? entry.tierPrices.regular : 0,
          }));
        })
      );
      const totals = computeBundleTotal(
        bundle.resources.map((r, i) => ({ resource: r, price: prices[i].price }))
      );
      // El link a la página del libro ancla (primero del bundle) con
      // ?bundle=slug preselecciona el resto como combo automáticamente
      // (ver EbookPricing) — comprar un bundle es 1 solo click de más.
      const anchorHref = EBOOK_CATALOG.find((e) => e.resource === bundle.resources[0])!.href;
      return {
        key: bundle.slug,
        title: bundle.title,
        description: bundle.pitch,
        href: `${anchorHref}?bundle=${bundle.slug}#comprar`,
        coverSrc: undefined as string | undefined,
        // Un combo no tiene portada propia: se muestran las de sus libros.
        coverSrcs: bundle.resources
          .map((r) => EBOOK_CATALOG.find((e) => e.resource === r)?.coverSrc)
          .filter((src): src is string => Boolean(src)),
        status: "available" as const,
        priceLabel: `$${totals.total.toLocaleString("es-CL")} CLP · ${totals.discountPercent}% off`,
      };
    })
  );

  return (
    <main className="monad">
      <section className="section-y-spacious px-6" style={{ paddingBottom: 56 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="ebook-store-intro">
            <EbookSectionHeading kicker="Biblioteca práctica">
              Aprende IA con <em style={{ fontStyle: "italic" }}>un siguiente paso claro.</em>
            </EbookSectionHeading>
            <p className="ebook-store-lede">
              Ebooks accionables para pasar de la curiosidad a una capacidad concreta: prompts,
              workflows y sistemas que puedes aplicar desde hoy.
            </p>
            <div className="ebook-store-proof" aria-label="Qué incluye cada ebook">
              <span>PDF inmediato</span>
              <span>Formatos para leer y trabajar</span>
              <span>Compra segura con Flow</span>
            </div>
          </div>

          <div className="ebook-store-section-label">
            <span>01</span>
            <strong>Disponibles ahora</strong>
            <i />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookCards.map(({ key, ...card }, i) => (
              <EbookCard key={key} index={i} {...card} />
            ))}
          </div>

          {bundleCards.length > 0 && (
            <>
              <div style={{ marginTop: 72, marginBottom: 40 }}>
                <EbookSectionHeading kicker="Combos" align="left" maxWidth={1200}>
                  Ahorra comprando{" "}
                  <em style={{ fontStyle: "italic" }}>más de un libro.</em>
                </EbookSectionHeading>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bundleCards.map(({ key, ...card }, i) => (
                  <EbookCard key={key} index={i} {...card} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
