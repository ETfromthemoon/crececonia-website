import Image from "next/image";
import styles from "./EbookProductTheater.module.css";
import type { EbookProductTheaterContent } from "@/lib/ebook-product-theater";

type EbookProductTheaterProps = {
  content: EbookProductTheaterContent;
};

export default function EbookProductTheater({ content }: EbookProductTheaterProps) {
  return (
    <>
      <section className={styles.proofBand} aria-label="Resumen del contenido del ebook">
        <div className={styles.proofInner}>
          {content.stats.map(({ value, label }) => (
            <div className={styles.proofItem} key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.theater} aria-labelledby="ebook-inside-title">
        <div className={styles.theaterIntro}>
          <p className={styles.kicker}>{content.inside.kicker}</p>
          <h2 id="ebook-inside-title">
            {content.inside.title}
          </h2>
          <p>{content.inside.description}</p>
          <a href="#comprar" className={styles.textCta}>
            Ir a comprar <span aria-hidden>↓</span>
          </a>
        </div>

        <div className={styles.previewRail} aria-label="Páginas reales del ebook">
          {content.previews.map((page, index) => (
            <figure className={styles.previewFigure} key={page.src}>
              <div className={styles.pageFrame}>
                <Image
                  src={page.src}
                  alt={page.alt}
                  width={page.width}
                  height={page.height}
                  sizes="(max-width: 720px) 78vw, (max-width: 1100px) 42vw, 360px"
                  className={styles.pageImage}
                />
                <span className={styles.pageNumber} aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <figcaption>
                <strong>{page.label}</strong>
                <span>{page.detail}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.journey} aria-labelledby="ebook-journey-title">
        <div className={styles.journeyHeader}>
          <p className={styles.kicker}>{content.journey.kicker}</p>
          <h2 id="ebook-journey-title">{content.journey.title}</h2>
        </div>
        <ol className={styles.journeyList}>
          {content.journey.steps.map((step) => (
            <li key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.outcome} aria-labelledby="ebook-outcome-title">
        <div className={styles.outcomeHeading}>
          <p className={styles.kicker}>{content.outcome.kicker}</p>
          <h2 id="ebook-outcome-title">{content.outcome.title}</h2>
        </div>
        <div className={styles.outcomeCompare}>
          <div>
            <span>Antes</span>
            <p>{content.outcome.before}</p>
          </div>
          <div className={styles.outcomeArrow} aria-hidden>→</div>
          <div>
            <span>Después</span>
            <p>{content.outcome.after}</p>
          </div>
        </div>
      </section>
    </>
  );
}
