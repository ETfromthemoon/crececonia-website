import Link from "next/link";
import Image from "next/image";

type Props = {
  title: string;
  description: string;
  href: string;
  coverSrc?: string;
  coverSrcs?: string[];
  status: "available" | "coming-soon";
  priceLabel?: string;
  previousPriceLabel?: string;
  level?: string;
  outcome?: string;
  audience?: string;
  pageCount?: number;
  itemCount?: number;
  variant?: "book" | "route";
  index?: number;
  onSelect?: () => void;
};

export default function EbookCard({ title, description, href, coverSrc, coverSrcs = [], status, priceLabel, previousPriceLabel, level, outcome, audience, pageCount, itemCount, variant = "book", index = 0, onSelect }: Props) {
  const isComingSoon = status === "coming-soon";
  const promotion = previousPriceLabel ? <p style={{ margin: "12px 0", fontSize: "0.9rem" }}><span>Antes </span><s>{previousPriceLabel}</s><br /><strong>50% de descuento · Solo por hoy</strong></p> : null;
  if (variant === "route") {
    return (
      <article className="ebook-route-card" style={{ "--route-index": index } as React.CSSProperties}>
        <div className="ebook-route-covers" aria-hidden="true">{coverSrcs.map((src, coverIndex) => <div key={src} style={{ transform: `translateX(${coverIndex * 19}px) rotate(${(coverIndex - 1.5) * 3}deg)`, zIndex: coverIndex }}><Image src={src} alt="" fill sizes="140px" /></div>)}</div>
        <div className="ebook-route-copy"><span>{String(index + 1).padStart(2, "0")} · {itemCount} libros</span><h3>{title}</h3><p>{description}</p>{promotion}<Link href={href} onClick={onSelect}><strong>{previousPriceLabel ? "Hoy " : ""}{priceLabel}</strong><span>Elegir ruta →</span></Link></div>
      </article>
    );
  }

  return (
    <article className="ebook-product-card" style={{ "--book-index": index } as React.CSSProperties}>
      <Link href={href} className="ebook-product-cover" aria-label={`Ver ${title}`} onClick={onSelect}>
        <Image src={coverSrc!} alt={`Portada de ${title}`} fill sizes="(max-width: 720px) 86vw, (max-width: 1100px) 42vw, 270px" priority={index < 2} />
        {isComingSoon && <span>Próximamente</span>}
      </Link>
      <div className="ebook-product-copy">
        <div className="ebook-product-meta"><span>{String(index + 1).padStart(2, "0")} / {level}</span><span>{pageCount}+ páginas</span></div>
        <h3>{title}</h3>
        <p className="ebook-product-outcome">{outcome ?? description}</p>
        <p className="ebook-product-audience">{audience}</p>
        {promotion}
        <Link href={href} className="ebook-product-action" onClick={onSelect}><span>{isComingSoon ? "Avísame cuando esté" : "Ver ebook"}</span><strong>{previousPriceLabel ? "Hoy " : ""}{priceLabel ?? "Próximamente"}</strong></Link>
      </div>
    </article>
  );
}
