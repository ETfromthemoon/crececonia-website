import Image from "next/image";
import styles from "./HomeEditorial.module.css";

export default function FeaturedResources() {
  return <section id="biblioteca" className={`${styles.library} site-container`} aria-labelledby="resources-title">
    <div className={styles.sectionHeading}><div><span className={styles.label}>La biblioteca / Para trabajar mejor</span><h2 id="resources-title">Conocimiento que<br /><em>sale del papel.</em></h2></div><a className="text-link" href="/centro">Todos los recursos ↗</a></div>
    <div className={styles.libraryGrid}>
      <article className={styles.featuredBook}><div className={styles.featuredCopy}><span className={styles.label}>Empieza por aquí / Ebook</span><h3>De cero a Claude<br />en una semana.</h3><p>Una ruta práctica para entender la herramienta y empezar a construir con ella.</p><a href="/ebook/de-cero-a-claude-en-una-semana" className="button button-dark">Ver el ebook y sus muestras ↗</a></div><div className={styles.pagePreview}><Image src="/ebooks/previews/de-cero-claude/claude-code.webp" alt="Página real del ebook: empezar con Claude Code" fill sizes="(max-width: 640px) 65vw, 300px" /></div><span className={styles.previewCaption}>Una página real. Un primer paso concreto.</span></article>
      <div className={styles.sideResources}>
        <a href="/centro/guias" className={styles.guideTile}><span className={styles.label}>Guías / Lectura abierta</span><span className={styles.largeSymbol} aria-hidden="true">Aa<span>↗</span></span><h3>Una tarea.<br />Paso a paso.</h3><p>Consulta el método, prueba y vuelve cuando lo necesites.</p><span className={styles.tileAction}>Explorar guías →</span></a>
        <a href="/centro/skills" className={styles.skillTile}><div><span className={styles.label}>Skills / Listas para aplicar</span><h3>Tu próxima capacidad.</h3><span className={styles.tileAction}>Explorar skills →</span></div><span className={styles.codeSymbol} aria-hidden="true">[↗]</span></a>
      </div>
    </div>
  </section>;
}
