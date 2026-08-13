import Image from "next/image";
import styles from "./EbookProductTheater.module.css";

const PREVIEW_PAGES = [
  {
    src: "/ebooks/previews/creacion-webs/indice.webp",
    alt: "Página real del índice del ebook Creación de Webs con IA",
    label: "El mapa completo",
    detail: "16 capítulos organizados en tres partes.",
  },
  {
    src: "/ebooks/previews/creacion-webs/metodologia-8-iteraciones.webp",
    alt: "Página real sobre la metodología de ocho iteraciones del ebook",
    label: "Un método ejecutable",
    detail: "Ocho fases con checkpoints y verificación.",
  },
  {
    src: "/ebooks/previews/creacion-webs/proyecto-appflow.webp",
    alt: "Página real del proyecto AppFlow desarrollado en el ebook",
    label: "Código y decisiones reales",
    detail: "AppFlow pasa del setup al MVP visual.",
  },
  {
    src: "/ebooks/previews/creacion-webs/seo-core-web-vitals.webp",
    alt: "Página real del capítulo de SEO y Core Web Vitals del ebook",
    label: "Lanzamiento verificable",
    detail: "SEO, rendimiento y métricas explicadas con criterio.",
  },
];

const JOURNEY = [
  {
    number: "01",
    title: "Fundamentos",
    text: "Defines dirección de arte, arquitectura y prompting antes de generar componentes.",
  },
  {
    number: "02",
    title: "Proyecto AppFlow",
    text: "Construyes una landing real durante ocho iteraciones documentadas, del setup al producto verificado.",
  },
  {
    number: "03",
    title: "Lanzamiento",
    text: "Cierras con formularios, SEO, Core Web Vitals, deploy, analítica, testing y legal básico.",
  },
];

export default function EbookProductTheater() {
  return (
    <>
      <section className={styles.proofBand} aria-label="Resumen del contenido del ebook">
        <div className={styles.proofInner}>
          {[
            ["70", "páginas"],
            ["16", "capítulos"],
            ["3", "partes"],
            ["1", "proyecto real"],
          ].map(([value, label]) => (
            <div className={styles.proofItem} key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.theater} aria-labelledby="ebook-inside-title">
        <div className={styles.theaterIntro}>
          <p className={styles.kicker}>Mira el producto por dentro</p>
          <h2 id="ebook-inside-title">
            No compras teoría sobre IA. Compras una construcción real, documentada de principio a fin.
          </h2>
          <p>
            Cada parte convierte una decisión abstracta en un paso ejecutable: qué pedir, qué revisar y cómo
            saber si el resultado está listo para avanzar.
          </p>
          <a href="#comprar" className={styles.textCta}>
            Ir a comprar <span aria-hidden>↓</span>
          </a>
        </div>

        <div className={styles.previewRail} aria-label="Páginas reales del ebook">
          {PREVIEW_PAGES.map((page, index) => (
            <figure className={styles.previewFigure} key={page.src}>
              <div className={styles.pageFrame}>
                <Image
                  src={page.src}
                  alt={page.alt}
                  width={923}
                  height={1305}
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
          <p className={styles.kicker}>La ruta del libro</p>
          <h2 id="ebook-journey-title">De una idea vaga a un sitio publicado y medible.</h2>
        </div>
        <ol className={styles.journeyList}>
          {JOURNEY.map((step) => (
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
          <p className={styles.kicker}>El valor está en el criterio</p>
          <h2 id="ebook-outcome-title">El objetivo no es que Claude haga una web. Es que tú puedas dirigir el resultado.</h2>
        </div>
        <div className={styles.outcomeCompare}>
          <div>
            <span>Antes</span>
            <p>Prompts sueltos, decisiones improvisadas y una landing que se parece a todas.</p>
          </div>
          <div className={styles.outcomeArrow} aria-hidden>→</div>
          <div>
            <span>Después</span>
            <p>Un proceso de ocho iteraciones para diseñar, construir, verificar y publicar con intención.</p>
          </div>
        </div>
      </section>
    </>
  );
}
