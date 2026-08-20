import { notFound } from "next/navigation";
import { getCatalogEntry, isAdminPreviewKey, isCatalogEntryLive } from "@/lib/ebook-catalog";
import { getCrossSellEntries } from "@/lib/ebook-crossell";
import { getEbookBundleOffers } from "@/lib/ebook-offers";
import { resolveBundleSelectionFromUrl } from "@/lib/ebook-bundles";
import { getCurrentPrice } from "@/lib/ebook-pricing";
import { WEB_EBOOK_PARTS } from "@/lib/web-ebook-series";
import EbookComingSoon from "@/components/EbookComingSoon";
import EbookGenericFAQ from "@/components/EbookGenericFAQ";
import EbookGenericHero from "@/components/EbookGenericHero";
import EbookGenericTOC from "@/components/EbookGenericTOC";
import EbookPageFrame from "@/components/EbookPageFrame";
import EbookPricing from "@/components/EbookPricing";
import EbookFit from "@/components/EbookFit";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function EbookWebPartPage({
  resource,
  searchParams,
}: {
  resource: string;
  searchParams: Promise<SearchParams>;
}) {
  const part = WEB_EBOOK_PARTS[resource];
  const entry = getCatalogEntry(resource);
  if (!part || !entry || !entry.active) notFound();

  const params = await searchParams;
  const previewKey = typeof params.preview === "string" ? params.preview : undefined;
  const isPreview = isAdminPreviewKey(previewKey);

  if (!isCatalogEntryLive(entry) && !isPreview) {
    return (
      <EbookPageFrame currentResource={resource}>
        <EbookComingSoon
          title={`${part.title}.`}
          description={part.description}
          ghostWord={part.title.split(" ")[0]}
          ctaSource={`ebook-${resource}-proximamente`}
          resource={resource}
        />
      </EbookPageFrame>
    );
  }

  const crossSellEntries = getCrossSellEntries(resource);
  const bundleOffers = getEbookBundleOffers(resource);
  const crossSellPrices = Object.fromEntries(await Promise.all(crossSellEntries.map(async (item) => [
    item.resource,
    (await getCurrentPrice(item.resource).catch(() => ({ price: item.tierPrices.regular }))).price,
  ])));
  const urlSelection = resolveBundleSelectionFromUrl(
    params,
    resource,
    crossSellEntries.map((item) => item.resource)
  );

  return (
    <EbookPageFrame currentResource={resource}>
      <EbookGenericHero
        resource={resource}
        eyebrow={part.eyebrow}
        title={part.title}
        titleAccent={part.titleAccent}
        description={part.description}
        coverSrc={entry.coverSrc}
        coverAlt={`Portada del ebook ${entry.title}`}
      />

      <section className="section-y px-6">
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <EbookSectionHeadingFallback title={part.introTitle} />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#000", lineHeight: 1.85 }}>
            {part.intro}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginTop: 36 }}>
            {part.stats.map((stat) => (
              <div key={stat.label} style={{ borderTop: "1px solid rgba(0,0,0,0.18)", paddingTop: 14 }}>
                <strong style={{ display: "block", fontFamily: "var(--font-serif-monad), Georgia, serif", fontSize: "2rem", fontWeight: 400 }}>{stat.value}</strong>
                <span style={{ color: "#4e4d4d", fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <EbookFit
        title={<>Un libro para construir con intención. <em style={{ fontStyle: "italic" }}>No solo para generar pantallas.</em></>}
        forYou={part.forYou}
        notFor={part.notFor}
      />

      <EbookGenericTOC title={<>{part.tocTitle}</>} sections={part.sections} />

      <EbookPricing
        resource={resource}
        crossSellEntries={crossSellEntries}
        crossSellPrices={crossSellPrices}
        bundleOffers={bundleOffers}
        previewKey={previewKey}
        {...urlSelection}
      />
      <EbookGenericFAQ faqs={part.faqs} />
    </EbookPageFrame>
  );
}

function EbookSectionHeadingFallback({ title }: { title: string }) {
  return (
    <h2 style={{ color: "#000", fontFamily: "var(--font-serif-monad), Georgia, serif", fontSize: "clamp(2rem, 4vw, 3.3rem)", fontWeight: 400, lineHeight: 1.1, margin: "0 0 20px" }}>
      {title}
    </h2>
  );
}
